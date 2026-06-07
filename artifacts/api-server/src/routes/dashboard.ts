import { Router } from "express";
import { desc, gte, sql, eq } from "drizzle-orm";
import { db, transactionsTable, walletsTable, auditLogsTable } from "@workspace/db";
import {
  GetDashboardStatsResponse,
  GetRecentActivityQueryParams,
  GetRecentActivityResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.use(requireAuth);

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [walletCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(walletsTable);

  const [pendingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactionsTable)
    .where(eq(transactionsTable.status, "pending"));

  const monthlyTxns = await db
    .select()
    .from(transactionsTable)
    .where(gte(transactionsTable.createdAt, startOfMonth));

  const outflow = monthlyTxns
    .filter((t) => ["broadcast", "confirmed", "signed"].includes(t.status))
    .reduce((sum, t) => sum + t.amount, 0);

  const inflow = monthlyTxns
    .filter((t) => t.status === "confirmed" && !t.fromWalletAddress)
    .reduce((sum, t) => sum + t.amount, 0);

  const allTxns = await db.select().from(transactionsTable).limit(100).orderBy(desc(transactionsTable.createdAt));

  const avgRisk =
    allTxns.length > 0
      ? Math.round(allTxns.reduce((s, t) => s + (t.riskScore ?? 30), 0) / allTxns.length)
      : 30;

  const healthScore = Math.max(0, Math.min(100, 100 - avgRisk));

  res.json(
    GetDashboardStatsResponse.parse({
      treasuryBalance: 1247.85,
      portfolioValue: 1247.85,
      monthlyOutflow: Math.round(outflow * 100) / 100,
      monthlyInflow: Math.round(inflow * 100) / 100,
      riskScore: avgRisk,
      healthScore,
      pendingCount: Number(pendingCount?.count ?? 0),
      connectedWallets: Number(walletCount?.count ?? 0),
      network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet",
    })
  );
});

router.get("/dashboard/recent-activity", async (req, res): Promise<void> => {
  const query = GetRecentActivityQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 10) : 10;

  const logs = await db
    .select()
    .from(auditLogsTable)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(limit);

  const activity = logs.map((log) => {
    let meta: any = {};
    try {
      meta = JSON.parse(log.metadata ?? "{}");
    } catch {}

    return {
      id: log.id,
      type: log.event,
      description: formatEvent(log.event, meta),
      amount: meta.amount ?? null,
      status: meta.status ?? null,
      timestamp: log.createdAt.toISOString(),
    };
  });

  res.json(GetRecentActivityResponse.parse(activity));
});

function formatEvent(event: string, meta: any): string {
  switch (event) {
    case "WALLET_CONNECTED":
      return `Wallet connected: ${(meta.address ?? "").slice(0, 8)}...`;
    case "WALLET_DISCONNECTED":
      return `Wallet disconnected: ${(meta.address ?? "").slice(0, 8)}...`;
    case "TRANSACTION_CREATED":
      return `Transaction created: ${meta.amount} ${meta.token ?? "SOL"} to ${(meta.recipient ?? "").slice(0, 8)}...`;
    case "TRANSACTION_BROADCAST":
      return `Transaction broadcast to Solana`;
    case "TRANSACTION_CONFIRMED":
      return `Transaction confirmed`;
    case "TRANSACTION_FAILED":
      return `Transaction failed`;
    case "AI_PROPOSAL_GENERATED":
      return `AI treasury proposal generated`;
    case "POLICY_CHECK_PASSED":
      return `Policy validation passed`;
    case "POLICY_CHECK_FAILED":
      return `Policy validation failed: ${meta.violations?.join(", ") ?? ""}`;
    case "POLICY_CREATED":
      return `Policy created: ${meta.name ?? ""}`;
    case "POLICY_UPDATED":
      return `Policy updated: ${meta.name ?? ""}`;
    case "TRANSACTION_SIMULATED":
      return `Transaction simulated: ${meta.success ? "success" : "failed"}`;
    default:
      return event.replace(/_/g, " ").toLowerCase();
  }
}

export default router;
