import React, { useState } from "react";
import { Transaction, PublicKey } from "@solana/web3.js";

export default function SignWithLedger({ txId, fromAddress, onComplete }: { txId: number; fromAddress: string; onComplete?: (sig: string) => void }) {
  const [busy, setBusy] = useState(false);

  const handleSign = async () => {
    setBusy(true);
    try {
      const resp = await fetch(`/api/transactions/${txId}/payload`);
      if (!resp.ok) throw new Error(`Failed to fetch payload: ${resp.statusText}`);
      const payload = await resp.json();

      const serializedBase64 = payload.unsignedTransactionSerialized;
      if (!serializedBase64) throw new Error("Server did not return serialized unsigned transaction");

      const raw = Buffer.from(serializedBase64, "base64");
      // Reconstruct transaction
      const tx = Transaction.from(raw);

      // Load Ledger HW transport and Solana app
      const TransportWebHID = (await import("@ledgerhq/hw-transport-webhid")).default;
      const SolanaApp = (await import("@ledgerhq/hw-app-solana")).default;

      const transport = await TransportWebHID.create();
      const sol = new SolanaApp(transport as any);

      // The ledger app expects the message bytes to sign
      const message = tx.serializeMessage();

      // Default derivation path; users should customize if needed
      const derivationPath = "44'/501'/0'/0'";

      // signTransaction may return an object or Buffer depending on lib version
      const signatureResp: any = await sol.signTransaction(derivationPath, Buffer.from(message));
      const signatureHex = signatureResp?.signature ? signatureResp.signature.toString('hex') : (signatureResp?.toString ? signatureResp.toString('hex') : null);
      if (!signatureHex) throw new Error("Failed to obtain signature from Ledger");
      const signature = Buffer.from(signatureHex, 'hex');

      // Attach signature
      const pubkey = new PublicKey(fromAddress);
      tx.addSignature(pubkey, signature);

      // Serialize signed transaction
      const signedRaw = tx.serialize();
      const signedBase64 = Buffer.from(signedRaw).toString('base64');

      // Broadcast via API
      const bresp = await fetch(`/api/transactions/${txId}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedTransaction: signedBase64 }),
      });
      if (!bresp.ok) {
        const txt = await bresp.text();
        throw new Error(txt || bresp.statusText);
      }
      const j = await bresp.json();
      if (onComplete) onComplete(j.signature);
      alert(`Broadcast success: ${j.signature}`);
    } catch (err: any) {
      console.error(err);
      alert(`Ledger signing failed: ${err?.message ?? err}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button className="btn btn-primary" onClick={handleSign} disabled={busy}>
      {busy ? "Signing with Ledger..." : "Sign with Ledger (WebHID / Speculos)"}
    </button>
  );
}
