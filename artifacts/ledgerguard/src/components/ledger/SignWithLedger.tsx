import { useState } from "react";
import { Transaction, PublicKey } from "@solana/web3.js";
import { useToast } from "@/hooks/use-toast";

export default function SignWithLedger({ txId, fromAddress, onComplete }: { txId: number; fromAddress: string; onComplete?: (sig: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [derivationPath, setDerivationPath] = useState("44'/501'/0'/0'");
  const [devicePubkey, setDevicePubkey] = useState<string | null>(null);
  const toastApi = useToast();

  const getDevicePubkey = async (sol: any, path: string) => {
    try {
      // hw-app-solana exposes getAddress
      const resp = await sol.getAddress(path);
      const pubkeyBuf = resp?.publicKey || resp?.pubKey || resp?.public_key;
      if (pubkeyBuf) {
        const hex = Buffer.from(pubkeyBuf).toString("hex");
        return { hex, base58: new PublicKey(pubkeyBuf).toBase58(), raw: pubkeyBuf };
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  const handleSign = async () => {
    setBusy(true);
    const pendingToast = toastApi.toast({ title: "Signing", description: "Connecting to Ledger/Speculos..." });
    try {
      const resp = await fetch(`/api/transactions/${txId}/payload`);
      if (!resp.ok) throw new Error(`Failed to fetch payload: ${resp.statusText}`);
      const payload = await resp.json();

      const serializedBase64 = payload.unsignedTransactionSerialized;
      if (!serializedBase64) throw new Error("Server did not return serialized unsigned transaction");

      const raw = Buffer.from(serializedBase64, "base64");
      const tx = Transaction.from(raw);

      let TransportWebHID: any;
      let SolanaApp: any;
      try {
        const transportModule = "@ledgerhq/" + "hw-transport-webhid";
        TransportWebHID = (await import(transportModule as string)).default;
      } catch (err) {
        throw new Error("@ledgerhq/hw-transport-webhid not installed. Install it or run in an environment with Ledger support.");
      }

      try {
        const solanaModule = "@ledgerhq/" + "hw-app-solana";
        SolanaApp = (await import(solanaModule as string)).default;
      } catch (err) {
        // If hw-app-solana is not installed, provide a helpful error rather than crashing.
        throw new Error("@ledgerhq/hw-app-solana is not installed. To enable Ledger signing, install @ledgerhq/hw-app-solana or use the Speculos emulator as documented.");
      }

      const transport = await TransportWebHID.create();
      const sol = new SolanaApp(transport as any);

      // Attempt to get device pubkey for confirmation
      const dev = await getDevicePubkey(sol, derivationPath);
      if (dev) {
        setDevicePubkey(dev.base58);
        if (fromAddress && fromAddress !== "" && fromAddress !== "11111111111111111111111111111111") {
          if (dev.base58 !== fromAddress) {
            toastApi.toast({ title: "Warning", description: "Ledger pubkey does not match transaction from address" });
          }
        }
      }

      const message = tx.serializeMessage();

      const signatureResp: any = await sol.signTransaction(derivationPath, Buffer.from(message));
      const sigBuf = signatureResp?.signature || signatureResp?.sig || signatureResp;
      if (!sigBuf) throw new Error("Failed to obtain signature from Ledger");
      const signature = Buffer.isBuffer(sigBuf) ? sigBuf : Buffer.from(sigBuf);

      const pubkey = new PublicKey(fromAddress);
      tx.addSignature(pubkey, signature);

      const signedRaw = tx.serialize();
      const signedBase64 = Buffer.from(signedRaw).toString('base64');

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
      pendingToast.update({ ...pendingToast, title: 'Success', description: `Broadcasted: ${j.signature}` });
      if (onComplete) onComplete(j.signature);
    } catch (err: any) {
      pendingToast.update({ ...pendingToast, title: 'Error', description: String(err?.message || err) });
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input className="input input-sm" value={derivationPath} onChange={(e) => setDerivationPath(e.target.value)} />
      <button className="btn btn-sm btn-primary" onClick={handleSign} disabled={busy}>{busy ? 'Signing...' : 'Sign with Ledger'}</button>
      {devicePubkey && <div className="text-xs font-mono">Device: {devicePubkey}</div>}
    </div>
  );
}
