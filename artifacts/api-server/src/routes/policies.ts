import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, policiesTable, auditLogsTable } from "@workspace/db";
import {
  ListPoliciesResponse,
  CreatePolicyBody,
  UpdatePolicyParams,
  UpdatePolicyBody,
  UpdatePolicyResponse,
  DeletePolicyParams,
  ValidateAgainstPoliciesBody,
  ValidateAgainstPoliciesResponse,
} from "@workspace/api-zod";
import { validateAgainstPolicies } from "../lib/policy-engine";
import { serializeList, serializeDates } from "../lib/serialize";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.use(requireAuth);

router.get("/policies", async (_req, res): Promise<void> => {
  const policies = await db.select().from(policiesTable).orderBy(policiesTable.createdAt);
  res.json(ListPoliciesResponse.parse(serializeList(policies)));
});

router.post("/policies", async (req, res): Promise<void> => {
  const parsed = CreatePolicyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [policy] = await db.insert(policiesTable).values(parsed.data).returning();

  await db.insert(auditLogsTable).values({
    event: "POLICY_CREATED",
    metadata: JSON.stringify({ id: policy.id, name: policy.name, type: policy.type }),
  });

  res.status(201).json(serializeDates(policy));
});

router.patch("/policies/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdatePolicyParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdatePolicyBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [policy] = await db
    .update(policiesTable)
    .set(body.data)
    .where(eq(policiesTable.id, params.data.id))
    .returning();

  if (!policy) {
    res.status(404).json({ error: "Policy not found" });
    return;
  }

  await db.insert(auditLogsTable).values({
    event: "POLICY_UPDATED",
    metadata: JSON.stringify({ id: policy.id, name: policy.name, enabled: policy.enabled }),
  });

  res.json(UpdatePolicyResponse.parse(serializeDates(policy)));
});

router.delete("/policies/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeletePolicyParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [policy] = await db
    .delete(policiesTable)
    .where(eq(policiesTable.id, params.data.id))
    .returning();

  if (!policy) {
    res.status(404).json({ error: "Policy not found" });
    return;
  }

  await db.insert(auditLogsTable).values({
    event: "POLICY_DELETED",
    metadata: JSON.stringify({ id: policy.id, name: policy.name }),
  });

  res.sendStatus(204);
});

router.post("/policies/validate", async (req, res): Promise<void> => {
  const parsed = ValidateAgainstPoliciesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const result = await validateAgainstPolicies(
    parsed.data.amount,
    parsed.data.recipient,
    parsed.data.token,
    parsed.data.timestamp ?? undefined
  );

  await db.insert(auditLogsTable).values({
    event: result.passed ? "POLICY_CHECK_PASSED" : "POLICY_CHECK_FAILED",
    metadata: JSON.stringify({
      amount: parsed.data.amount,
      recipient: parsed.data.recipient,
      violations: result.violations,
    }),
  });

  res.json(ValidateAgainstPoliciesResponse.parse(result));
});

export default router;
