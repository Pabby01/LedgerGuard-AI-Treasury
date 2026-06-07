import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, walletsTable } from "@workspace/db";
import {
  ListWalletsResponse,
  ConnectWalletBody,
  DisconnectWalletParams,
  GetWalletBalanceParams,
  GetWalletBalanceResponse,
} from "@workspace/api-zod";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { auditLogsTable } from "@workspace/db";
import { serializeList, serializeDates } from "../lib/serialize";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const getRpcUrl = () =>
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

router.use(requireAuth);

router.get("/wallets", async (req, res): Promise<void> => {
  const wallets = await db.select().from(walletsTable).orderBy(walletsTable.createdAt);
  res.json(ListWalletsResponse.parse(serializeList(wallets)));
});

router.post("/wallets", async (req, res): Promise<void> => {
  const parsed = ConnectWalletBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(walletsTable)
    .where(eq(walletsTable.address, parsed.data.address))
    .limit(1);

  if (existing.length > 0) {
    res.status(201).json(existing[0]);
    return;
  }

  const [wallet] = await db.insert(walletsTable).values(parsed.data).returning();

  await db.insert(auditLogsTable).values({
    event: "WALLET_CONNECTED",
    metadata: JSON.stringify({ address: wallet.address, network: wallet.network }),
    walletAddress: wallet.address,
  });

  res.status(201).json(wallet);
});

router.delete("/wallets/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DisconnectWalletParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [wallet] = await db
    .delete(walletsTable)
    .where(eq(walletsTable.id, params.data.id))
    .returning();

  if (!wallet) {
    res.status(404).json({ error: "Wallet not found" });
    return;
  }

  await db.insert(auditLogsTable).values({
    event: "WALLET_DISCONNECTED",
    metadata: JSON.stringify({ address: wallet.address }),
    walletAddress: wallet.address,
  });

  res.sendStatus(204);
});

router.get("/wallets/:id/balance", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetWalletBalanceParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [wallet] = await db
    .select()
    .from(walletsTable)
    .where(eq(walletsTable.id, params.data.id))
    .limit(1);

  if (!wallet) {
    res.status(404).json({ error: "Wallet not found" });
    return;
  }

  try {
    const connection = new Connection(getRpcUrl(), "confirmed");
    const pubkey = new PublicKey(wallet.address);
    const lamports = await connection.getBalance(pubkey);
    const balanceSol = lamports / LAMPORTS_PER_SOL;

    res.json(
      GetWalletBalanceResponse.parse({
        address: wallet.address,
        balanceLamports: lamports,
        balanceSol,
        network: wallet.network,
      })
    );
  } catch (err) {
    req.log.error({ err }, "Failed to fetch balance");
    res.status(502).json({ error: "Failed to fetch balance from Solana" });
  }
});

export default router;
