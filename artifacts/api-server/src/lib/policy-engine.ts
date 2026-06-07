import { db, policiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface PolicyValidationResult {
  passed: boolean;
  violations: string[];
  warnings: string[];
}

export async function validateAgainstPolicies(
  amount: number,
  recipient: string,
  token: string,
  timestamp?: string
): Promise<PolicyValidationResult> {
  const policies = await db
    .select()
    .from(policiesTable)
    .where(eq(policiesTable.enabled, true));

  const violations: string[] = [];
  const warnings: string[] = [];

  for (const policy of policies) {
    switch (policy.type) {
      case "max_transaction_amount": {
        const max = parseFloat(policy.value);
        if (amount > max) {
          violations.push(
            `${policy.name}: Amount ${amount} ${token} exceeds maximum of ${max} ${token}`
          );
        } else if (amount > max * 0.8) {
          warnings.push(
            `${policy.name}: Amount ${amount} ${token} is near the maximum of ${max} ${token}`
          );
        }
        break;
      }

      case "allowed_recipients": {
        const allowed = policy.value.split(",").map((a) => a.trim().toLowerCase());
        if (!allowed.includes(recipient.toLowerCase())) {
          violations.push(
            `${policy.name}: Recipient ${recipient.slice(0, 8)}... is not on the allowed list`
          );
        }
        break;
      }

      case "business_hours": {
        const [start, end] = policy.value.split("-").map(Number);
        const hour = new Date(timestamp || Date.now()).getUTCHours();
        if (hour < start || hour >= end) {
          violations.push(
            `${policy.name}: Transactions are only allowed between ${start}:00 and ${end}:00 UTC`
          );
        }
        break;
      }

      case "require_approval_above": {
        const threshold = parseFloat(policy.value);
        if (amount > threshold) {
          warnings.push(
            `${policy.name}: Amount ${amount} ${token} exceeds ${threshold} ${token} — manual approval required`
          );
        }
        break;
      }

      case "blocked_recipients": {
        const blocked = policy.value.split(",").map((a) => a.trim().toLowerCase());
        if (blocked.includes(recipient.toLowerCase())) {
          violations.push(
            `${policy.name}: Recipient ${recipient.slice(0, 8)}... is on the blocked list`
          );
        }
        break;
      }
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    warnings,
  };
}
