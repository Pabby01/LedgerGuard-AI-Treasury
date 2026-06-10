import { Router } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, transactionsTable, auditLogsTable } from "@workspace/db";
import {
  ListTransactionsQueryParams,
  ListTransactionsResponse,
  CreateTransactionBody,
  GetTransactionParams,
  GetTransactionResponse,
  UpdateTransactionParams,
  UpdateTransactionBody,
  UpdateTransactionResponse,
  SimulateTransactionParams,
  SimulateTransactionResponse,
  BroadcastTransactionParams,
  BroadcastTransactionBody,
  BroadcastTransactionResponse,
  GetTransactionRiskParams,
  GetTransactionRiskResponse,
} from "@workspace/api-zod";
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmRawTransaction } from "@solana/web3.js";
import { assessRisk } from "../lib/risk-engine";
import { serializeList, serializeDates } from "../lib/serialize";
import { requireAuth } from "../middlewares/auth";
import { issuePayloadChallenge, validatePayloadChallenge, writeRateLimiter } from "../middlewares/security";
import { logger } from "../lib/logger";

const router = Router();

const getRpcUrl = () => process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

function toTransactionStatus(signatureInfo: { err: unknown; confirmationStatus?: string | null }) {
  if (signatureInfo.err) return "failed" as const;
  if (signatureInfo.confirmationStatus === "confirmed" || signatureInfo.confirmationStatus === "finalized") {
    return "confirmed" as const;
  }
  return "broadcast" as const;
}

function mapParsedChainTransaction(
  parsedTransaction: any,
  signatureInfo: { signature: string; blockTime?: number | null; err: unknown; confirmationStatus?: string | null },
  walletAddress: string,
  syntheticId: number,
) {
  const instructions = parsedTransaction?.transaction?.message?.instructions ?? [];

  let recipient = walletAddress;
  let fromWalletAddress = walletAddress;
  let amount = 0;
  let token = "SOL";
  let memo: string | null = null;

  for (const instruction of instructions) {
    if (!instruction || typeof instruction !== "object" || !("parsed" in instruction)) continue;

    const parsed = (instruction as { parsed?: any; program?: string }).parsed;
    const program = (instruction as { parsed?: any; program?: string }).program;
    if (!parsed) continue;

    if (program === "system" && parsed.type === "transfer") {
      recipient = parsed.info?.destination ?? recipient;
      fromWalletAddress = parsed.info?.source ?? fromWalletAddress;
      amount = Number(parsed.info?.lamports ?? 0) / LAMPORTS_PER_SOL;
      token = "SOL";
      continue;
    }

    if (program === "spl-token" && String(parsed.type ?? "").startsWith("transfer")) {
      recipient = parsed.info?.destination ?? recipient;
      fromWalletAddress = parsed.info?.source ?? fromWalletAddress;
      amount = Number(parsed.info?.tokenAmount?.uiAmount ?? parsed.info?.amount ?? 0);
      token = parsed.info?.mint ?? "SPL";
      continue;
    }

    if (program === "spl-memo") {
      memo = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    }
  }

  const timestamp = signatureInfo.blockTime
    ? new Date(signatureInfo.blockTime * 1000).toISOString()
    : new Date().toISOString();

  return {
    id: syntheticId,
    signature: signatureInfo.signature,
    amount: Number.isFinite(amount) ? amount : 0,
    recipient,
    token,
    memo,
    status: toTransactionStatus(signatureInfo),
    riskScore: null,
    riskLevel: null,
    network: "devnet",
    fromWalletAddress,
    aiProposed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

async function getOnChainTransactions(walletAddress: string, limit: number, offset: number) {
  const connection = new Connection(getRpcUrl(), "confirmed");
  const address = new PublicKey(walletAddress);
  const pageSize = Math.min(Math.max(limit + offset, 25), 100);
  const signatures = await connection.getSignaturesForAddress(address, { limit: pageSize });
  const pagedSignatures = signatures.slice(offset, offset + limit);

  if (pagedSignatures.length === 0) {
    return [];
  }

  const parsedTransactions = await connection.getParsedTransactions(
    pagedSignatures.map((signature) => signature.signature),
    { commitment: "confirmed", maxSupportedTransactionVersion: 0 },
  );

  return pagedSignatures.map((signatureInfo, index) =>
    mapParsedChainTransaction(
      parsedTransactions[index],
      signatureInfo,
      walletAddress,
      -(offset + index + 1),
    ),
  );
}

type SerializedTransaction = {
  id: number;
  signature: string | null;
  amount: number;
  recipient: string;
  token: string;
  memo: string | null;
  status: string;
  riskScore: number | null;
  riskLevel: string | null;
  network: string;
  fromWalletAddress: string | null;
  aiProposed?: boolean;
  createdAt: string;
  updatedAt?: string;
};

router.use(requireAuth);
router.use(writeRateLimiter);

router.get("/transactions", async (req, res): Promise<void> => {
  const query = ListTransactionsQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 50) : 50;
  const offset = query.success ? (query.data.offset ?? 0) : 0;
  const statusFilter = query.success ? query.data.status : undefined;

  const txns = await db
    .select()
    .from(transactionsTable)
    .orderBy(desc(transactionsTable.createdAt))
    .limit(Math.min(Math.max(limit + offset, 50), 200));

  const dbTransactions: SerializedTransaction[] = txns.map((transaction) => ({
    ...transaction,
    signature: transaction.signature ?? null,
    memo: transaction.memo ?? null,
    riskScore: transaction.riskScore ?? null,
    riskLevel: transaction.riskLevel ?? null,
    fromWalletAddress: transaction.fromWalletAddress ?? null,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  }));
  let mergedTransactions: SerializedTransaction[] = dbTransactions;

  if (req.session.walletAddress) {
    try {
      const onChainTransactions = await getOnChainTransactions(req.session.walletAddress, limit, offset);
      const seenSignatures = new Set(
        dbTransactions
          .map((transaction) => transaction.signature)
          .filter((signature): signature is string => Boolean(signature)),
      );

      mergedTransactions = [
        ...dbTransactions,
        ...onChainTransactions.filter((transaction) => !seenSignatures.has(transaction.signature)),
      ];
    } catch (err) {
      req.log.warn({ err, walletAddress: req.session.walletAddress }, "Failed to fetch on-chain transaction history");
    }
  }

  const filteredTransactions = statusFilter
    ? mergedTransactions.filter((transaction) => transaction.status === statusFilter)
    : mergedTransactions;

  const pagedTransactions = filteredTransactions
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(offset, offset + limit);

  res.json(ListTransactionsResponse.parse(pagedTransactions));
});

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const risk = await assessRisk(
      parsed.data.amount,
      parsed.data.recipient,
      parsed.data.token,
      parsed.data.fromWalletAddress ?? undefined
    );

    const txn = await db.transaction(async (tx) => {
      const [newTxn] = await tx
        .insert(transactionsTable)
        .values({
          ...parsed.data,
          riskScore: risk.riskScore,
          riskLevel: risk.level,
          status: "pending",
        })
        .returning();

      await tx.insert(auditLogsTable).values({
        event: "TRANSACTION_CREATED",
        metadata: JSON.stringify({
          id: newTxn.id,
          amount: newTxn.amount,
          token: newTxn.token,
          recipient: newTxn.recipient,
          riskScore: risk.riskScore,
          riskLevel: risk.level,
        }),
        walletAddress: newTxn.fromWalletAddress ?? undefined,
      });

      return newTxn;
    });

    res.status(201).json(GetTransactionResponse.parse(serializeDates(txn)));
  } catch (err) {
    logger.error({ err }, "Failed to create transaction");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/transactions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTransactionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [txn] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, params.data.id))
    .limit(1);

  if (!txn) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json(GetTransactionResponse.parse(serializeDates(txn)));
});

router.patch("/transactions/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateTransactionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateTransactionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [txn] = await db
    .update(transactionsTable)
    .set(body.data)
    .where(eq(transactionsTable.id, params.data.id))
    .returning();

  if (!txn) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  if (body.data.status) {
    await db.insert(auditLogsTable).values({
      event: `TRANSACTION_${body.data.status.toUpperCase()}`,
      metadata: JSON.stringify({ id: txn.id, status: body.data.status, signature: body.data.signature }),
      walletAddress: txn.fromWalletAddress ?? undefined,
    });
  }

  res.json(UpdateTransactionResponse.parse(serializeDates(txn)));
});

router.post("/transactions/:id/simulate", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SimulateTransactionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [txn] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, params.data.id))
    .limit(1);

  if (!txn) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  try {
    const challenge = issuePayloadChallenge(req.session, txn.id);
    const connection = new Connection(getRpcUrl(), "confirmed");
    const fromPubkey = new PublicKey(txn.fromWalletAddress || "11111111111111111111111111111111");
    const toPubkey = new PublicKey(txn.recipient);
    const lamports = Math.floor(txn.amount * LAMPORTS_PER_SOL);

    const { blockhash } = await connection.getLatestBlockhash();
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: fromPubkey,
    }).add(
      SystemProgram.transfer({ fromPubkey, toPubkey, lamports })
    );

    const sim = await connection.simulateTransaction(transaction);

    await db.insert(auditLogsTable).values({
      event: "TRANSACTION_SIMULATED",
      metadata: JSON.stringify({ id: txn.id, success: !sim.value.err }),
      walletAddress: txn.fromWalletAddress ?? undefined,
    });

    res.json(
      SimulateTransactionResponse.parse({
        success: !sim.value.err,
        estimatedFee: 5000,
        logs: sim.value.logs ?? [],
        error: sim.value.err ? JSON.stringify(sim.value.err) : null,
      })
    );
  } catch (err) {
    req.log.error({ err }, "Simulation failed");
    res.status(502).json({ error: "Simulation failed" });
  }
});

// Generate unsigned signable payload for external signing (Ledger / Wallet CLI / DMK)
router.get("/transactions/:id/payload", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const idParam = parseInt(raw, 10);
  if (Number.isNaN(idParam)) {
    res.status(400).json({ error: "Invalid transaction id" });
    return;
  }

  const [txn] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, idParam))
    .limit(1);

  if (!txn) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  try {
    const challenge = issuePayloadChallenge(req.session, txn.id);
    const connection = new Connection(getRpcUrl(), "confirmed");
    const fromPubkey = new PublicKey(txn.fromWalletAddress || "11111111111111111111111111111111");
    const toPubkey = new PublicKey(txn.recipient);
    const lamports = Math.floor(txn.amount * LAMPORTS_PER_SOL);

    const { blockhash } = await connection.getLatestBlockhash();
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: fromPubkey,
    }).add(
      SystemProgram.transfer({ fromPubkey, toPubkey, lamports })
    );

    // Serialize the message (unsigned) so external signer can sign the canonical payload
    const messageBytes = transaction.serializeMessage();
    const unsignedBase64 = Buffer.from(messageBytes).toString("base64");
    // Also provide the full unsigned transaction serialized (signatures empty)
    const unsignedTxRaw = transaction.serialize({ requireAllSignatures: false });
    const unsignedTxBase64 = Buffer.from(unsignedTxRaw).toString("base64");

    await db.insert(auditLogsTable).values({
      event: "TRANSACTION_EXPORT_UNSIGNED",
      metadata: JSON.stringify({ id: txn.id, exportedAt: new Date().toISOString() }),
      walletAddress: txn.fromWalletAddress ?? undefined,
    });

    res.json({
      unsignedTransaction: unsignedBase64,
      unsignedTransactionSerialized: unsignedTxBase64,
      requiredSigners: [fromPubkey.toBase58()],
      recentBlockhash: blockhash,
      payloadToken: challenge.token,
      payloadExpiresAt: new Date(challenge.expiresAt).toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to build unsigned payload");
    res.status(502).json({ error: "Failed to build unsigned payload" });
  }
});

router.post("/transactions/:id/broadcast", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = BroadcastTransactionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = BroadcastTransactionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [txn] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, params.data.id))
    .limit(1);

  if (!txn) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  if (txn.status === "broadcast" || txn.status === "confirmed") {
    res.status(409).json({ error: "Transaction already broadcast" });
    return;
  }

  const challengeCheck = validatePayloadChallenge(req.session, txn.id, body.data.payloadToken);
  if (!challengeCheck.ok) {
    res.status(409).json({ error: challengeCheck.reason });
    return;
  }

  try {
    const connection = new Connection(getRpcUrl(), "confirmed");
    const rawTx = Buffer.from(body.data.signedTransaction, "base64");
    const signature = await connection.sendRawTransaction(rawTx);

    await db
      .update(transactionsTable)
      .set({ status: "broadcast", signature })
      .where(eq(transactionsTable.id, txn.id));

    await db.insert(auditLogsTable).values({
      event: "TRANSACTION_BROADCAST",
      metadata: JSON.stringify({ id: txn.id, signature }),
      walletAddress: txn.fromWalletAddress ?? undefined,
    });

    res.json(BroadcastTransactionResponse.parse({ signature, success: true }));
  } catch (err: any) {
    req.log.error({ err }, "Broadcast failed");
    await db
      .update(transactionsTable)
      .set({ status: "failed" })
      .where(eq(transactionsTable.id, txn.id));

    await db.insert(auditLogsTable).values({
      event: "TRANSACTION_FAILED",
      metadata: JSON.stringify({ id: txn.id, error: err?.message }),
      walletAddress: txn.fromWalletAddress ?? undefined,
    });

    res.status(502).json({ error: err?.message || "Broadcast failed" });
  }
});

router.get("/transactions/:id/risk", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTransactionRiskParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [txn] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, params.data.id))
    .limit(1);

  if (!txn) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  const risk = await assessRisk(txn.amount, txn.recipient, txn.token, txn.fromWalletAddress ?? undefined);
  res.json(GetTransactionRiskResponse.parse(risk));
});

export default router;
