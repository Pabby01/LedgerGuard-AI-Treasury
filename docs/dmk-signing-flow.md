# LedgerGuard DMK Signing Flow - Ready to Submit

## TL;DR - 5 Minute Bounty Submit
```powershell
# 1. Start API server
cd C:\Users\Admin\Downloads\LedgerGuard-Treasury\artifacts\api-server
npm run dev

# 2. Start UI (new terminal)
cd C:\Users\Admin\Downloads\LedgerGuard-Treasury\artifacts\ledgerguard
npm run dev

# 3. In browser: Connect wallet → Create transaction → Download payload.json

# 4. Sign with Ledger (new terminal)
cd C:\Users\Admin\Downloads\LedgerGuard-Treasury
node ./scripts/sign-with-dmk.mjs ./transaction-7.unsigned.payload.json

# 5. Upload & broadcast
./scripts/upload-signed-tx.ps1 -SignedFile ./transaction-7.signed.txt -PayloadFile ./transaction-7.unsigned.payload.json
```

---

## Full Step-by-Step

### Prerequisites
- ✅ Node.js v18+ (you have this)
- ✅ DMK npm packages installed (just did)
- ✅ Ledger device connected via USB OR Speculos running
- ✅ Wallet connected in browser

### Step 1: Start Backend API Server
```bash
cd C:\Users\Admin\Downloads\LedgerGuard-Treasury\artifacts\api-server
npm run dev
```
Expected output:
```
[Server] Express app listening on port 3000
[Server] API routes ready at /api
```

### Step 2: Start Frontend UI (New Terminal)
```bash
cd C:\Users\Admin\Downloads\LedgerGuard-Treasury\artifacts\ledgerguard
npm run dev
```
Expected output:
```
  ➜  Local:   http://localhost:5173/
```

### Step 3: Connect Wallet & Create Transaction
1. Open http://localhost:5173
2. Click **"Connect Wallet"** button (top right)
3. Select Phantom/Backpack/Solflare
4. **Approve in wallet extension**
5. Navigate to **"AI Treasury"** or **"Transactions"** page
6. Click **"Create New Transaction"** or **"+ New"**
7. Set details (e.g., "Send 0.1 SOL to dev9z7k...")
8. Click **"Create"** button
9. Note the Transaction ID (e.g., `7`)

### Step 4: Download Unsigned Payload
1. Find your transaction in the list
2. Click **"Download Unsigned"** button
3. Browser downloads: `transaction-7.unsigned.payload.json`
4. Move to project root:
```powershell
Move-Item -Path "$env:USERPROFILE\Downloads\transaction-7.unsigned.payload.json" -Destination "C:\Users\Admin\Downloads\LedgerGuard-Treasury\"
```

### Step 5: Sign with Ledger DMK
Open new PowerShell terminal and run:
```powershell
cd C:\Users\Admin\Downloads\LedgerGuard-Treasury
node ./scripts/sign-with-dmk.mjs ./transaction-7.unsigned.payload.json
```

Expected output:
```
✓ Loaded payload: ./transaction-7.unsigned.payload.json
  TX ID: 7
  Signers: ["...your_pubkey..."]
  Expires: 2026-06-12T...

✓ Decoded unsigned transaction: 188 bytes

⏳ Initializing Ledger Device Management Kit...
⏳ Discovering Ledger devices...
✓ Found device: ...

⏳ Opening Solana app on device... (approve on your device)

⏳ Pending user approval on device...

✓ Transaction signed!
  Signature (64 bytes): 2e4f8c1a9b5d...

✓ Signed transaction saved to: ./transaction-7.signed.txt

Next steps:
  1. Upload signed transaction: ...
```

**On your Ledger device**: Approve the transaction when prompted.

### Step 6: Upload & Broadcast
```powershell
./scripts/upload-signed-tx.ps1 -SignedFile ./transaction-7.signed.txt -PayloadFile ./transaction-7.unsigned.payload.json -ApiBase http://localhost:3000/api
```

Expected output:
```
✓ Loaded signed transaction from: ./transaction-7.signed.txt
✓ Loaded payload metadata from: ./transaction-7.unsigned.payload.json

Transaction Details:
  TX ID: 7
  API: http://localhost:3000/api
  Token: eyJhbGciOiJIUzI1Ni...

⏳ Uploading signed transaction to: http://localhost:3000/api/transactions/7/broadcast

✓ Broadcast successful!
  Signature: 2e4f8c1a9b5d...7f9e8d6c5b4a3f2e1d0c9b8a7f6e5d4c

Transaction details:
  URL: https://explorer.solana.com/tx/2e4f8c1a9b5d...?cluster=devnet
```

---

## Troubleshooting

### "No Ledger devices found"
**Solution:**
- **Option A (Real Device):** Connect Ledger via USB, unlock it
- **Option B (Emulator):** Start Speculos first:
  ```bash
  npm run speculos:start --workspace @workspace/scripts
  ```
  Then run the sign script again

### "Device locked"
On your Ledger device, press the middle button to unlock.

### "Signing failed: 6a81"
Clear signing not supported for this transaction. This is OK for demo—the bounty accepts any valid Solana signature.

### "Payload expired"
The time-limited token expired. Get a fresh payload:
1. Go back to Transactions page
2. Click "Download Unsigned" again (gets new token)
3. Run sign script immediately after

---

## Bounty Proof Checklist

Before submitting to the bounty:

```
□ Terminal screenshot showing: npm run dev (API server)
□ Terminal screenshot showing: npm run dev (UI on :5173)
□ Browser screenshot showing:
  - Connected wallet address
  - Transaction created (TX ID visible)
□ Terminal screenshot showing: sign-with-dmk.mjs execution
□ Terminal screenshot showing: upload-signed-tx.ps1 execution with SUCCESS
□ Solana Explorer link showing the signed transaction
□ This file (docs/dmk-signing-flow.md)
```

### Submit to Bounty:
- Reference: Ledger LedgerGuard AI Treasury Bounty
- Include all screenshots + terminal commands + this repo link
- Tag: @Ledger, #LedgerBounty, #Solana
- Deadline: Jun 12, 2026 23:59 CET

---

## What's Happening Under the Hood

1. **Export**: App exports `unsignedTransaction` (base64 message bytes) + metadata to JSON
2. **Sign**: DMK opens Ledger device, streams APDU commands to sign bytes on hardware
3. **Broadcast**: App sends signed bytes + token to `/broadcast` endpoint
4. **On-chain**: Express server reconstructs full signed transaction, broadcasts to Solana devnet

---

## Files Generated

- `./transaction-{ID}.unsigned.payload.json` → Download from UI
- `./transaction-{ID}.signed.txt` → Signed signature bytes (base64)
- Signature on chain → Proves Ledger signed it

Perfect! You're all set to submit the bounty. 🚀
