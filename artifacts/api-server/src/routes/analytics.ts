import { Router } from "express";
import { gte, desc, sql, eq } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  GetSpendingAnalyticsQueryParams,
  GetSpendingAnalyticsResponse,
  GetTreasuryHealthResponse,
  GetTopRecipientsQueryParams,
  GetTopRecipientsResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const getRpcUrl = () =>
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

async function getLiveTreasuryBalance(walletAddress?: string): Promise<number> {
  if (!walletAddress) return 0;

  const connection = new Connection(getRpcUrl(), "confirmed");
  const lamports = await connection.getBalance(new PublicKey(walletAddress));
  return lamports / LAMPORTS_PER_SOL;
}

router.use(requireAuth);

router.get("/analytics/spending", async (req, res): Promise<void> => {
  const query = GetSpendingAnalyticsQueryParams.safeParse(req.query);
  const period = query.success ? (query.data.period ?? "monthly") : "monthly";

  const now = new Date();
  let startDate: Date;
  let dataPoints: { label: string; start: Date; end: Date }[] = [];

  if (period === "weekly") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dataPoints.push({
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        start: new Date(d.setHours(0, 0, 0, 0)),
        end: new Date(d.setHours(23, 59, 59, 999)),
      });
    }
  } else if (period === "monthly") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      dataPoints.push({
        label: d.toLocaleDateString("en-US", { month: "short" }),
        start: d,
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
      });
    }
  } else {
    startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    for (let i = 3; i >= 0; i--) {
      const qStart = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
      const qEnd = new Date(now.getFullYear(), now.getMonth() - i * 3 + 3, 0, 23, 59, 59);
      dataPoints.push({ label: `Q${Math.ceil((now.getMonth() - i * 3 + 1) / 3)}`, start: qStart, end: qEnd });
    }
  }

  const txns = await db
    .select()
    .from(transactionsTable)
    .where(gte(transactionsTable.createdAt, startDate));

  const data = dataPoints.map((dp) => {
    const periodTxns = txns.filter(
      (t) => t.createdAt >= dp.start && t.createdAt <= dp.end && ["broadcast", "confirmed", "signed"].includes(t.status)
    );
    return {
      label: dp.label,
      amount: Math.round(periodTxns.reduce((s, t) => s + t.amount, 0) * 100) / 100,
      count: periodTxns.length,
    };
  });

  const completedTxns = txns.filter((t) => ["broadcast", "confirmed", "signed"].includes(t.status));
  const totalSpent = completedTxns.reduce((s, t) => s + t.amount, 0);
  const avgTransactionSize = completedTxns.length > 0 ? totalSpent / completedTxns.length : 0;

  res.json(
    GetSpendingAnalyticsResponse.parse({
      period,
      data,
      totalSpent: Math.round(totalSpent * 100) / 100,
      avgTransactionSize: Math.round(avgTransactionSize * 100) / 100,
      transactionCount: completedTxns.length,
    })
  );
});

router.get("/analytics/treasury-health", async (req, res): Promise<void> => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentTxns = await db
    .select()
    .from(transactionsTable)
    .where(gte(transactionsTable.createdAt, thirtyDaysAgo));

  const burnRate = recentTxns
    .filter((t) => ["broadcast", "confirmed", "signed"].includes(t.status))
    .reduce((s, t) => s + t.amount, 0);

  let treasuryBalance = 0;
  try {
    treasuryBalance = await getLiveTreasuryBalance(req.session.walletAddress);
  } catch (err) {
    req.log.warn({ err, walletAddress: req.session.walletAddress }, "Failed to fetch live treasury balance");
  }
  const monthlyBurn = burnRate;
  const runwayMonths = monthlyBurn > 0 ? treasuryBalance / monthlyBurn : 999;

  const allTxns = await db.select().from(transactionsTable).limit(200);
  const avgRisk = allTxns.length > 0
    ? allTxns.reduce((s, t) => s + (t.riskScore ?? 30), 0) / allTxns.length
    : 30;

  const healthScore = Math.max(0, Math.min(100, Math.round(
    (runwayMonths >= 12 ? 40 : runwayMonths / 12 * 40) +
    ((100 - avgRisk) / 100 * 40) +
    20
  )));

  const status =
    healthScore >= 80 ? "EXCELLENT" :
    healthScore >= 60 ? "GOOD" :
    healthScore >= 40 ? "FAIR" : "CRITICAL";

  res.json(
    GetTreasuryHealthResponse.parse({
      healthScore,
      runway: Math.round(treasuryBalance * 100) / 100,
      burnRate: Math.round(monthlyBurn * 100) / 100,
      runwayMonths: Math.min(999, Math.round(runwayMonths * 10) / 10),
      status,
    })
  );
});

router.get("/analytics/top-recipients", async (req, res): Promise<void> => {
  const query = GetTopRecipientsQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 5) : 5;

  const txns = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.status, "confirmed"));

  const recipientMap = new Map<string, { totalAmount: number; transactionCount: number }>();
  for (const txn of txns) {
    const existing = recipientMap.get(txn.recipient) ?? { totalAmount: 0, transactionCount: 0 };
    recipientMap.set(txn.recipient, {
      totalAmount: existing.totalAmount + txn.amount,
      transactionCount: existing.transactionCount + 1,
    });
  }

  const top = Array.from(recipientMap.entries())
    .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
    .slice(0, limit)
    .map(([address, stats]) => ({
      address,
      label: null,
      totalAmount: Math.round(stats.totalAmount * 100) / 100,
      transactionCount: stats.transactionCount,
    }));

  res.json(GetTopRecipientsResponse.parse(top));
});

export default router;
