# Submit Tonight: WebHID + Speculos on Windows (60-minute runbook)

Goal: get one successful signed+broadcast flow and capture proof assets for submission.

## 0) Start app stack (5-10 min)

From repo root, run API and frontend in separate terminals:

- npm run dev --workspace @workspace/api-server
- npm run dev --workspace @workspace/ledgerguard

Open the app in Chrome/Edge at http://localhost:3001.

## 1) WebHID path first (10-15 min)

1. Launch Speculos with Solana app in a mode that exposes a HID/WebHID-compatible interface to Windows host browser.
2. In the app, create a transaction and open signing modal.
3. Click Sign with Ledger.
4. Accept browser HID chooser prompt.
5. Confirm signing inside emulator/device.

If chooser says no compatible devices found, do not burn time. Move to Section 2 immediately.

## 2) Guaranteed fallback path for tonight (20 min)

This path still proves Ledger/Speculos signing flow with exported payload + signed upload/broadcast.

### 2.1 Export payload and token

Run:

- node ./scripts/export_unsigned_tx.js http://localhost:3000 <TX_ID>

Artifacts generated:

- transaction-<TX_ID>.unsigned.txt
- transaction-<TX_ID>.unsigned.payload.json

Important: keep the payload token from the metadata file tied to this exact signing attempt.

### 2.2 Sign with your Ledger toolchain (DMK / Wallet CLI / Speculos)

Input message file:

- transaction-<TX_ID>.unsigned.txt

Output signed base64 file:

- transaction-<TX_ID>.signed.txt

If using Speculos directly from this repo (no WebHID, no physical Ledger), run:

- npm run speculos:sign --workspace @workspace/scripts -- --payload ./transaction-<TX_ID>.unsigned.payload.json --out ./transaction-<TX_ID>.signed.txt --host 127.0.0.1 --apdu-port 40000 --button-port 5001 --auto-approve

Notes:
- Ensure Speculos is already running with the Solana app and APDU port exposed.
- `--auto-approve` sends right-button clicks periodically while awaiting signature.

### 2.3 Broadcast with payload token

Run:

- ./scripts/sign-and-broadcast.ps1 -ApiBase http://localhost:3000 -SignedFile ./transaction-<TX_ID>.signed.txt -TxId <TX_ID> -PayloadMetaFile ./transaction-<TX_ID>.unsigned.payload.json

Expected output includes success and chain signature.

## 3) Evidence pack for submission (15 min)

Capture these assets:

1. Screen recording:
- Show transaction creation in LedgerGuard UI
- Show Speculos/device signing step
- Show successful broadcast signature in UI or terminal

2. Terminal proof:
- Export command and resulting files
- Sign command invocation (redact secrets)
- Broadcast command output containing signature

3. Repository references to mention:
- docs/ledger-integration.md
- artifacts/ledgerguard/src/components/ledger/SignWithLedger.tsx
- artifacts/api-server/src/routes/transactions.ts
- scripts/export_unsigned_tx.js
- scripts/sign-and-broadcast.ps1

## 4) Common failure recovery

- Error: no compatible devices found
  - Cause: WebHID cannot see emulator HID interface.
  - Action: switch to Section 2 fallback immediately.

- Error: missing/invalid payload token
  - Cause: signed payload does not match current challenge token.
  - Action: re-export payload and token, sign again, rebroadcast with the new metadata file.

- Error: transaction expired
  - Cause: blockhash/token timeout.
  - Action: re-export and re-sign quickly.

## 5) 60-minute clock plan

- Minute 0-10: start stack and create transaction
- Minute 10-25: attempt WebHID once
- Minute 25-45: execute fallback export/sign/broadcast
- Minute 45-60: capture evidence and submit
