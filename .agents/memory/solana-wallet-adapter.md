---
name: Solana wallet adapter blocked
description: @solana/wallet-adapter-* packages are blocked by Replit package firewall. Use custom Zustand store + manual address input modal instead.
---

`@solana/wallet-adapter-react`, `@solana/wallet-adapter-base`, and related adapter packages are blocked by the Replit package firewall. Only `@solana/web3.js` and `bs58` could be installed.

**Workaround:** Custom Zustand store at `artifacts/ledgerguard/src/store/use-wallet-store.ts` holds `{ address, network }`. A "Connect Wallet" dialog in the top bar lets users paste their Solana address manually. The wallet address is passed to API calls as `walletAddress` in request bodies.

**Why:** Package firewall restriction — attempting to add wallet-adapter packages will fail with a resolution error.

**How to apply:** Never recommend or attempt to install `@solana/wallet-adapter-*`. Use `useWalletStore()` from the Zustand store for wallet state.
