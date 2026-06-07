import { pgTable, text, serial, timestamp, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  signature: text("signature"),
  amount: real("amount").notNull(),
  recipient: text("recipient").notNull(),
  token: text("token").notNull().default("SOL"),
  memo: text("memo"),
  status: text("status").notNull().default("pending"),
  riskScore: integer("risk_score"),
  riskLevel: text("risk_level"),
  network: text("network").notNull().default("devnet"),
  fromWalletAddress: text("from_wallet_address"),
  aiProposed: boolean("ai_proposed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
