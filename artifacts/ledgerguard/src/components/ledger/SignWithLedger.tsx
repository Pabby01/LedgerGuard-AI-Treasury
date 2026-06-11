import { useState } from "react";
import { Transaction, PublicKey } from "@solana/web3.js";
import { useToast } from "@/hooks/use-toast";

const base64ToBytes = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

const bytesToBase64 = (value: Uint8Array) => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < value.length; index += chunkSize) {
    binary += String.fromCharCode(...value.subarray(index, index + chunkSize));
  }
  return btoa(binary);
};

const bytesToHex = (value: Uint8Array) => Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join("");

const toBytes = (value: unknown) => {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (Array.isArray(value)) return Uint8Array.from(value);
  return new Uint8Array();
};

const toLedgerErrorMessage = (err: unknown) => {
  const message = String((err as { message?: string })?.message || err || "Unknown Ledger error");
  const normalized = message.toLowerCase();

  if (normalized.includes("no compatible devices") || normalized.includes("not found")) {
    return "No Ledger HID device was detected. If using Speculos, ensure it is exposed as a WebHID-compatible device. Otherwise use the Download Unsigned Payload + Upload Signed Payload fallback.";
  }

  if (normalized.includes("notallowederror") || normalized.includes("permission")) {
    return "Ledger connection permission was denied. Re-open signing, allow the browser HID prompt, and keep the Solana app open.";
  }

  if (normalized.includes("solana app")) {
    return "Open the Solana app on the Ledger device (or Speculos app) and retry signing.";
  }

  return message;
};

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
        const raw = toBytes(pubkeyBuf);
        return { hex: bytesToHex(raw), base58: new PublicKey(raw).toBase58(), raw };
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
      if (!(navigator as any).hid) {
        throw new Error(
          "WebHID is not available in this browser. Use Chrome/Edge and ensure the site is accessed over localhost or HTTPS."
        );
      }

      const resp = await fetch(`/api/transactions/${txId}/payload`);
      if (!resp.ok) throw new Error(`Failed to fetch payload: ${resp.statusText}`);
      const payload = await resp.json();

      const serializedBase64 = payload.unsignedTransactionSerialized;
      if (!serializedBase64) throw new Error("Server did not return serialized unsigned transaction");

      const raw = base64ToBytes(serializedBase64);
      const tx = Transaction.from(raw);

      let TransportWebHID: any;
      let SolanaApp: any;
      try {
        TransportWebHID = (await import("@ledgerhq/hw-transport-webhid")).default;
      } catch (err) {
        throw new Error("Failed to load Ledger transport. Ensure the app is built with Ledger support.");
      }

      try {
        SolanaApp = (await import("@ledgerhq/hw-app-solana")).default;
      } catch (err) {
        throw new Error("Failed to load Ledger Solana app.");
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

      const signatureResp: any = await sol.signTransaction(derivationPath, message);
      const sigBuf = toBytes(signatureResp?.signature || signatureResp?.sig || signatureResp);
      if (!sigBuf.length) throw new Error("Failed to obtain signature from Ledger");
      const signature = sigBuf as unknown as Parameters<Transaction["addSignature"]>[1];

      const pubkey = new PublicKey(fromAddress);
      tx.addSignature(pubkey, signature);

      const signedRaw = tx.serialize();
      const signedBase64 = bytesToBase64(signedRaw);

      const bresp = await fetch(`/api/transactions/${txId}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedTransaction: signedBase64, payloadToken: payload.payloadToken }),
      });
      if (!bresp.ok) {
        const txt = await bresp.text();
        throw new Error(txt || bresp.statusText);
      }
      const j = await bresp.json();
      pendingToast.update({ ...pendingToast, title: 'Success', description: `Broadcasted: ${j.signature}` });
      if (onComplete) onComplete(j.signature);
    } catch (err: any) {
      pendingToast.update({ ...pendingToast, title: 'Error', description: toLedgerErrorMessage(err) });
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
