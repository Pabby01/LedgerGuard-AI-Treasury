# LedgerGuard AI Treasury OS

A production-grade full-stack SaaS for Solana organizations. AI-powered treasury management: chat with GPT-4o-mini to propose transfers, run policy validation, simulate/broadcast transactions, audit everything.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/ledgerguard run dev` — run the frontend (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `OPENAI_API_KEY`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (artifacts/api-server, port 8080)
- Frontend: React + Vite + Tailwind v4 + shadcn/ui + wouter + recharts + zustand (artifacts/ledgerguard)
- DB: PostgreSQL + Drizzle ORM (lib/db)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from lib/api-spec/openapi.yaml)
- AI: OpenAI SDK, gpt-4o-mini, OPENAI_API_KEY env var
- Solana: @solana/web3.js for balance/simulate/broadcast (no wallet adapter — custom Zustand store)

## Where things live

- `lib/db/src/schema/index.ts` — DB schema (wallets, transactions, policies, ai_conversations, audit_logs)
- `lib/api-spec/openapi.yaml` — OpenAPI source of truth
- `lib/api-zod/src/generated/api.ts` — Zod schemas (generated)
- `lib/api-client-react/src/generated/api.ts` — React Query hooks (generated)
- `artifacts/api-server/src/routes/` — all backend routes
- `artifacts/api-server/src/lib/` — risk-engine, policy-engine, serialize helpers
- `artifacts/ledgerguard/src/pages/` — 7 pages: dashboard, ai-treasury, transactions, analytics, policies, audit, settings
- `artifacts/ledgerguard/src/store/use-wallet-store.ts` — Zustand wallet state
- `artifacts/ledgerguard/src/components/layout/app-layout.tsx` — sidebar + topbar layout

## Architecture decisions

- **No wallet adapter packages** — `@solana/wallet-adapter-*` blocked by package firewall; wallet address is manually entered via modal and stored in Zustand.
- **OpenAI direct SDK** — uses `OPENAI_API_KEY` env var directly, not Replit AI proxy (user declined paid tier upgrade).
- **Drizzle dates → ISO strings** — Drizzle returns `Date` objects; routes use `serializeDates/serializeList` (api-server/src/lib/serialize.ts) before passing to Zod response parsers which expect strings.
- **Zod response validation** — all routes validate outgoing responses with generated Zod schemas to catch schema drift early.
- **Contract-first API** — OpenAPI spec → Orval codegen → Zod schemas + React Query hooks. Edit the spec, run codegen, never hand-write hooks.

## Product

- **Dashboard** — live treasury balance, risk/health scores, pending approvals queue, recent audit feed
- **AI Treasury** — GPT-4o-mini chat with ACTION_PROPOSAL structured outputs; one-click "Approve & Create Transaction"
- **Transactions** — full table with risk badges, click-to-detail modal with approve/reject for pending txns
- **Analytics** — health gauge, runway calculator, spending area chart (weekly/monthly/quarterly), top recipients bar chart
- **Policies** — create/toggle/delete guardrails (max amount, approval thresholds, business hours, allowlists)
- **Audit Logs** — immutable feed of all events with structured metadata
- **Settings** — network selector, RPC URL, Ledger mode, AI model

## User preferences

_None explicitly recorded yet._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml` before touching frontend code.
- `pnpm --filter @workspace/db run push` must be run after schema changes — never edit schema without pushing.
- Drizzle Date objects must be serialized via `serializeDates` before Zod `.parse()` — Zod schemas use `zod.string()` for dates.
- Do NOT run `pnpm run dev` at workspace root — use workflows or `--filter`.
- Solana wallet-adapter packages are blocked; use the custom Zustand store pattern.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
