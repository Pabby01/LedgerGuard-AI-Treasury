import { db, transactionsTable } from "@workspace/db";
import { eq, and, gte, ne } from "drizzle-orm";

export interface RiskAssessment {
  riskScore: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reasons: string[];
}

function getRiskLevel(score: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}

export async function assessRisk(
  amount: number,
  recipient: string,
  token: string,
  fromAddress?: string
): Promise<RiskAssessment> {
  const reasons: string[] = [];
  let score = 0;

  // Large transfer amount
  if (amount > 1000) {
    score += 35;
    reasons.push("Very large transfer amount (>1000 SOL)");
  } else if (amount > 100) {
    score += 20;
    reasons.push("Large transfer amount (>100 SOL)");
  } else if (amount > 10) {
    score += 8;
    reasons.push("Moderate transfer amount (>10 SOL)");
  }

  // Outside business hours (UTC 09:00–18:00)
  const hour = new Date().getUTCHours();
  if (hour < 9 || hour > 18) {
    score += 15;
    reasons.push("Transfer initiated outside business hours");
  }

  // Unknown recipient — check if they've received before
  const recipientHistory = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.recipient, recipient))
    .limit(5);

  if (recipientHistory.length === 0) {
    score += 25;
    reasons.push("Unknown recipient (no prior transaction history)");
  } else if (recipientHistory.length < 3) {
    score += 10;
    reasons.push("Low transaction history with recipient");
  }

  // High frequency — many txns from this wallet recently
  if (fromAddress) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentFromWallet = await db
      .select()
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.fromWalletAddress, fromAddress),
          gte(transactionsTable.createdAt, oneHourAgo),
          ne(transactionsTable.status, "rejected")
        )
      );

    if (recentFromWallet.length > 5) {
      score += 20;
      reasons.push("High transfer frequency from this wallet in last hour");
    } else if (recentFromWallet.length > 2) {
      score += 8;
      reasons.push("Elevated transfer frequency from this wallet");
    }
  }

  // Cap at 100
  score = Math.min(100, score);
  if (reasons.length === 0) reasons.push("Transaction appears standard");

  return {
    riskScore: score,
    level: getRiskLevel(score),
    reasons,
  };
}
