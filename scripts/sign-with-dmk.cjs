#!/usr/bin/env node

const fs = require("fs");
const { DeviceManagementKitBuilder } = require("@ledgerhq/device-management-kit");
const { SignerSolanaBuilder } = require("@ledgerhq/device-signer-kit-solana");
const {
  nodeHidIdentifier,
  nodeHidTransportFactory,
} = require("@ledgerhq/device-transport-kit-node-hid");
const { Transaction, PublicKey } = require("@solana/web3.js");
const { firstValueFrom } = require("rxjs");

async function signTransaction(payloadPath) {
  if (!fs.existsSync(payloadPath)) {
    throw new Error(`Payload file not found: ${payloadPath}`);
  }

  const payload = JSON.parse(fs.readFileSync(payloadPath, "utf-8"));
  const txId = payload.txId;
  const signerAddress = payload.requiredSigners?.[0];

  if (!signerAddress) {
    throw new Error("Payload missing requiredSigners[0]");
  }
  if (!payload.unsignedTransactionSerialized) {
    throw new Error("Payload missing unsignedTransactionSerialized");
  }
  if (!payload.unsignedTransaction) {
    throw new Error("Payload missing unsignedTransaction");
  }

  console.log(`Loaded payload for tx #${txId}`);
  console.log(`Signer: ${signerAddress}`);

  // Sign the canonical message bytes from payload.
  const messageBytes = Buffer.from(payload.unsignedTransaction, "base64");

  const dmk = new DeviceManagementKitBuilder()
    .addTransport(nodeHidTransportFactory)
    .build();

  console.log("Discovering Ledger devices over Node HID...");
  const discoveredDevice = await firstValueFrom(
    dmk.startDiscovering({ transport: nodeHidIdentifier })
  );

  if (!discoveredDevice) {
    throw new Error("No Ledger device discovered. Connect USB and unlock device.");
  }

  const sessionId = await dmk.connect({ device: discoveredDevice });
  await dmk.stopDiscovering();
  console.log(`Connected session: ${sessionId}`);

  const signer = new SignerSolanaBuilder({
    dmk,
    sessionId,
    solanaRPCURL: "https://api.devnet.solana.com",
  }).build();

  const derivationPath = "m/44'/501'/0'/0'";
  console.log("Waiting for Ledger approval...");

  const { observable } = signer.signTransaction(
    derivationPath,
    new Uint8Array(messageBytes),
    { skipOpenApp: false }
  );

  const signature = await new Promise((resolve, reject) => {
    const subscription = observable.subscribe({
      next: (state) => {
        if (state.status === "pending") {
          console.log("Pending user action on device...");
        } else if (state.status === "completed") {
          resolve(Buffer.from(state.output));
          subscription.unsubscribe();
        } else if (state.status === "error") {
          reject(new Error(state.error?.message || "DMK signing failed"));
          subscription.unsubscribe();
        }
      },
      error: (err) => reject(err),
    });
  });

  // Attach signature to full transaction wire format and serialize signed tx.
  const tx = Transaction.from(Buffer.from(payload.unsignedTransactionSerialized, "base64"));
  tx.addSignature(new PublicKey(signerAddress), signature);

  if (!tx.verifySignatures(false)) {
    throw new Error("Signature verification failed after signing");
  }

  const signedBase64 = tx.serialize({ verifySignatures: true, requireAllSignatures: true }).toString("base64");

  const outFile = payloadPath.replace(/\.unsigned\.payload\.json$/, ".signed.txt");
  fs.writeFileSync(outFile, `${signedBase64}\n`, "utf-8");

  console.log(`Signed transaction written: ${outFile}`);
  console.log("Use this file with Upload Signed Payload or scripts/upload-signed-tx.ps1.");

  await dmk.disconnect({ sessionId });
  dmk.close();
}

(async () => {
  try {
    const payloadPath = process.argv[2];
    if (!payloadPath) {
      throw new Error("Usage: node scripts/sign-with-dmk.cjs <path-to-unsigned.payload.json>");
    }
    await signTransaction(payloadPath);
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    console.error(`Error: ${message}`);
    if (err && typeof err === "object") {
      try {
        console.error("Details:", JSON.stringify(err, null, 2));
      } catch {
        console.error("Details (raw):", err);
      }
    }
    process.exit(1);
  }
})();
