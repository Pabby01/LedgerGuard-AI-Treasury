import { Router } from "express";
import { desc } from "drizzle-orm";
import { db, auditLogsTable } from "@workspace/db";
import {
  ListAuditLogsQueryParams,
  ListAuditLogsResponse,
} from "@workspace/api-zod";
import { serializeList } from "../lib/serialize";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.use(requireAuth);

router.get("/audit-logs", async (req, res): Promise<void> => {
  const query = ListAuditLogsQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 50) : 50;
  const offset = query.success ? (query.data.offset ?? 0) : 0;

  const logs = await db
    .select()
    .from(auditLogsTable)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(ListAuditLogsResponse.parse(serializeList(logs)));
});

export default router;
