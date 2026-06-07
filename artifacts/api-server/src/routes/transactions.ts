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
import { logger } from "../lib/logger";

const router = Router();

const getRpcUrl = () => process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

router.use(requireAuth);

router.get("/transactions", async (req, res): Promise<void> => {
  const query = ListTransactionsQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 50) : 50;
  const offset = query.success ? (query.data.offset ?? 0) : 0;

  const txns = await db
    .select()
    .from(transactionsTable)
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(ListTransactionsResponse.parse(serializeList(txns)));
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
