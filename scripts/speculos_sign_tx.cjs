#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");

const SpeculosTransport = require("@ledgerhq/hw-transport-node-speculos").default;
const SolanaApp = require("@ledgerhq/hw-app-solana").default;
const { PublicKey, Transaction } = require("@solana/web3.js");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function usage() {
  console.log(
    [
      "Usage:",
      "  node ./scripts/speculos_sign_tx.cjs --payload ./transaction-6.unsigned.payload.json --out ./transaction-6.signed.txt",
      "",
      "Options:",
      "  --payload       Path to .payload.json from export_unsigned_tx.js (required)",
      "  --out           Output file for signed base64 tx (required)",
      "  --path          Derivation path (default: 44'/501'/0'/0')",
      "  --signer        Override signer public key (default: payload.requiredSigners[0])",
      "  --host          Speculos host (default: 127.0.0.1)",
      "  --apdu-port     Speculos APDU port (default: 40000)",
      "  --button-port   Speculos button port (default: 5001)",
      "  --auto-approve  Send periodic right-button events while waiting for signature",
    ].join("\n")
  );
}

function normalizePath(input) {
  if (!input) return "44'/501'/0'/0'";
  return input.startsWith("m/") ? input.slice(2) : input;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.payload || !args.out || args.help) {
    usage();
    process.exit(args.help ? 0 : 2);
  }

  const payloadPath = path.resolve(process.cwd(), String(args.payload));
  const outPath = path.resolve(process.cwd(), String(args.out));
  const derivationPath = normalizePath(String(args.path || "44'/501'/0'/0'"));
  const host = String(args.host || "127.0.0.1");
  const apduPort = Number(args["apdu-port"] || 40000);
  const buttonPort = Number(args["button-port"] || 5001);
  const autoApprove = Boolean(args["auto-approve"]);

  if (!fs.existsSync(payloadPath)) {
    throw new Error(`Payload file not found: ${payloadPath}`);
  }

  const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
  if (!payload.unsignedTransactionSerialized) {
    throw new Error("Payload missing unsignedTransactionSerialized");
  }

  const signerAddress = String(args.signer || payload.requiredSigners?.[0] || "");
  if (!signerAddress) {
    throw new Error("Could not resolve signer address. Provide --signer <base58>");
  }

  const unsignedRaw = Buffer.from(String(payload.unsignedTransactionSerialized), "base64");
  const tx = Transaction.from(unsignedRaw);
  const msg = tx.serializeMessage();

  console.log(`Connecting to Speculos at ${host}:${apduPort} (button ${buttonPort})...`);
  const transport = await SpeculosTransport.open({ host, apduPort, buttonPort });
  const sol = new SolanaApp(transport);

  let approveTimer = null;
  if (autoApprove) {
    approveTimer = setInterval(() => {
      transport.button("Rr").catch(() => {});
    }, 900);
  }

  try {
    const addr = await sol.getAddress(derivationPath);
    const devicePubkey = new PublicKey(addr.address).toBase58();
    console.log(`Speculos pubkey: ${devicePubkey}`);
    if (devicePubkey !== signerAddress) {
      console.warn(`Warning: signer ${signerAddress} does not match Speculos pubkey ${devicePubkey}`);
    }

    console.log(`Signing transaction message with path ${derivationPath}...`);
    const signatureResp = await sol.signTransaction(derivationPath, Buffer.from(msg));
    const signature = signatureResp.signature;
    tx.addSignature(new PublicKey(signerAddress), signature);

    const signedBase64 = Buffer.from(tx.serialize()).toString("base64");
    fs.writeFileSync(outPath, signedBase64, "utf8");
    console.log(`Signed transaction written to ${outPath}`);
  } finally {
    if (approveTimer) {
      clearInterval(approveTimer);
    }
    await transport.close();
  }
}

main().catch((err) => {
  console.error(`Error: ${err?.message || err}`);
  process.exit(1);
});
