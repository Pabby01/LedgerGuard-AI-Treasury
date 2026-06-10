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
import { requireRole, writeRateLimiter } from "../middlewares/security";
import { logger } from "../lib/logger";

const router = Router();

const getRpcUrl = () =>
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

router.use(requireAuth);
router.post("/wallets", requireRole("admin"));
router.delete("/wallets/:id", requireRole("admin"));

router.get("/wallets", async (req, res): Promise<void> => {
  const wallets = await db.select().from(walletsTable).orderBy(walletsTable.createdAt);
  res.json(ListWalletsResponse.parse(serializeList(wallets)));
});

router.post("/wallets", writeRateLimiter, async (req, res): Promise<void> => {
  const parsed = ConnectWalletBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const result = await db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(walletsTable)
        .where(eq(walletsTable.address, parsed.data.address))
        .limit(1);

      if (existing.length > 0) {
        return { status: 200, wallet: existing[0] };
      }

      const [wallet] = await tx.insert(walletsTable).values(parsed.data).returning();

      await tx.insert(auditLogsTable).values({
        event: "WALLET_CONNECTED",
        metadata: JSON.stringify({ address: wallet.address, network: wallet.network }),
        walletAddress: wallet.address,
      });

      return { status: 201, wallet };
    });

    res.status(result.status).json(result.wallet);
  } catch (err) {
    logger.error({ err }, "Failed to connect wallet");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/wallets/:id", writeRateLimiter, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DisconnectWalletParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const wallet = await db.transaction(async (tx) => {
      const [deletedWallet] = await tx
        .delete(walletsTable)
        .where(eq(walletsTable.id, params.data.id))
        .returning();

      if (!deletedWallet) {
        return null;
      }

      await tx.insert(auditLogsTable).values({
        event: "WALLET_DISCONNECTED",
        metadata: JSON.stringify({ address: deletedWallet.address }),
        walletAddress: deletedWallet.address,
      });

      return deletedWallet;
    });

    if (!wallet) {
      res.status(404).json({ error: "Wallet not found" });
      return;
    }

    res.sendStatus(204);
  } catch (err) {
    logger.error({ err }, "Failed to disconnect wallet");
    res.status(500).json({ error: "Internal server error" });
  }
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
