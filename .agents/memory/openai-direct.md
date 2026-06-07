---
name: OpenAI direct SDK
description: Project uses OpenAI SDK directly with OPENAI_API_KEY env var, not Replit AI Integrations proxy. User explicitly declined the paid tier upgrade needed for the proxy.
---

The AI routes use `openai` npm package directly with `process.env.OPENAI_API_KEY`. The user was offered the Replit AI Integrations proxy but declined (requires paid tier upgrade).

**Why:** User has their own OpenAI API key and chose not to upgrade. The `OPENAI_API_KEY` secret is already set in the Replit secrets manager.

**How to apply:** Do not suggest switching to `@replit/ai-integrations` or Replit's proxy. Keep using `new OpenAI({ apiKey: process.env.OPENAI_API_KEY })` directly.
