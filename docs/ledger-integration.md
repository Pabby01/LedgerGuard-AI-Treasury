# Ledger / Speculos Integration Guide

This project supports an external signing flow so you can use Ledger hardware or the Speculos emulator and the Ledger "Wallet CLI" / DMK tools to sign transactions.

Overview
- The application creates unsigned transactions and stores them in the DB.
- Use the API endpoint `/transactions/:id/payload` to export a canonical unsigned payload (base64 of the Solana message).
- Use your Ledger Wallet CLI / DMK or Speculos to sign that payload and produce a base64 signed transaction.
- Upload the signed base64 to `/transactions/:id/broadcast` to broadcast the transaction.

Quick demo (local)
1. Start the API server (see repo `artifacts/api-server` run instructions).
2. Create an AI-proposed transaction in the UI or via the API so you have a transaction id (e.g., 123).
3. Export the unsigned payload:

```bash
node ./scripts/export_unsigned_tx.js http://localhost:3000 123
```

That writes `transaction-123.unsigned.txt` containing the base64 unsigned message.

4. Use your Ledger Wallet CLI / DMK or Speculos to sign the payload. Example (pseudo):

```bash
# PSEUDO-COMMAND - replace with your actual Wallet CLI invocation
wallet-cli sign --message-file transaction-123.unsigned.txt --derivation "m/44'/501'/0'" --output transaction-123.signed.txt
```

For emulator-based proof, run Speculos and the appropriate Ledger app for Solana. See:
- https://github.com/LedgerHQ/speculos

5. Broadcast the signed base64 (PowerShell helper provided):

```powershell
.
Scripts\sign-and-broadcast.ps1 -ApiBase http://localhost:3000 -UnsignedFile .\transaction-123.unsigned.txt -SignedFile .\transaction-123.signed.txt -TxId 123
```

(Or simply POST the signed base64 to `/transactions/123/broadcast` with JSON `{ "signedTransaction": "<base64>" }`.)

Notes
- This repo intentionally leaves CLI-specific signing commands as examples because the DMK / Wallet CLI evolves; edit `scripts/sign-and-broadcast.ps1` to match your local CLI.
- For contest submission to Ledger: record the signing flow on Speculos (screen capture), include the commands you ran, and show the device/emulator signing screen as proof.

Security
- Never commit real private keys or production `OPENAI_API_KEY` values. Use environment variables and `.env` files that are not checked into source control.
