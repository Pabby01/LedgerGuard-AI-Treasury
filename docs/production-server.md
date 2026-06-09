# Production Server Guide

This document describes recommended steps and configuration for running LedgerGuard in production.

1) Environment & secrets
- Use a secure secret store or environment injection. Do NOT check `.env` into source control.
- Required env vars (example):
  - `DATABASE_URL` (Postgres)
  - `OPENAI_API_KEY` (or other AI provider)
  - `SESSION_SECRET` (strong random string)
  - `RPC_URL` (Solana cluster, e.g. https://api.mainnet-beta.solana.com)
  - `LEDGER_MODE` (speculos | ledger)

2) Build & deploy
- Build the API server (`artifacts/api-server`) with `npm install` then `npm run build` (project uses tsc build in workspace).
- Build frontend (`artifacts/ledgerguard`) with `npm install` then `npm run build`.
- Serve frontend via CDN or static host; backend via Node.js process manager (systemd, PM2) behind reverse proxy (nginx).

3) Database
- Use managed Postgres (e.g., AWS RDS, Railway) with daily backups and point-in-time recovery.
- Run migrations and apply schema changes carefully; use migration tooling (db-migrate, prisma migrate, or drizzle migrations).

4) Secrets and keys
- Do not store private keys on disk. For enterprise features consider HSM or KMS (AWS KMS, Google KMS).
- For signing with Ledger devices the signing is client-side (WebHID) and does not require server keys.

5) SSL/TLS
- Terminate TLS at load balancer or reverse proxy. Enforce HTTPS and HSTS.

6) Logging & monitoring
- Ship logs to a centralized system (Datadog, Papertrail, ELK).
- Monitor error rates, latency, and queue lengths. Set up alerts.

7) Scaling
- Stateless API servers; scale horizontally. Use connection pooling for Postgres.
- Cache frequent reads (treasury metadata) in Redis if necessary.

8) Security
- Rate limit signing exports and broadcast endpoints to prevent abuse.
- Require RBAC: only authorized users (roles) may request exports or broadcasts.
- Add CSRF protections and secure cookies for session authentication.

9) Backups & recovery
- Regular DB backups and test restores.
- Backup audit logs in immutable storage.

10) Testing & CI
- Add automated tests including unit tests, integration tests, and an E2E test that uses Speculos to validate signing flow.
- Use CI to run tests and build artifacts before deployment.

11) Speculos in CI
- Use the provided `ci/speculos.Dockerfile` to run the emulator in CI for E2E signing tests.
- Ensure the CI runner allows the container to expose the device interface (may require privileged mode).

12) Operational runbook
- Provide steps to rotate API keys, recover from failed broadcasts, and revoke compromised accounts.


Checklist before accepting paying customers:
- [ ] RBAC and strict auth on signing endpoints
- [ ] Rate limits and replay protection
- [ ] Backups and monitoring configured
- [ ] Clear privacy/security policy and data retention policy
- [ ] Automated tests including Speculos E2E
- [ ] Deployment scripts and infrastructure as code

