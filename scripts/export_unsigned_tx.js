#!/usr/bin/env node
// Simple helper: fetch unsigned payload from API and write to files
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

if (process.argv.length < 4) {
  console.error('Usage: node export_unsigned_tx.js <API_BASE_URL> <TRANSACTION_ID> [OUTFILE]');
  process.exit(2);
}

const API = process.argv[2].replace(/\/$/, '');
const TXID = process.argv[3];
const OUT = process.argv[4] || `transaction-${TXID}.unsigned.txt`;
const META_OUT = OUT.replace(/\.txt$/i, '.payload.json');

(async () => {
  try {
    const resp = await fetch(`${API}/transactions/${TXID}/payload`);
    if (!resp.ok) throw new Error(`Failed to fetch payload: ${resp.status} ${resp.statusText}`);
    const json = await resp.json();
    if (!json.unsignedTransaction) {
      throw new Error('API payload response missing unsignedTransaction');
    }
    fs.writeFileSync(OUT, json.unsignedTransaction, 'utf8');
    fs.writeFileSync(META_OUT, JSON.stringify({
      txId: Number(TXID),
      payloadToken: json.payloadToken || null,
      payloadExpiresAt: json.payloadExpiresAt || null,
      unsignedTransaction: json.unsignedTransaction,
      unsignedTransactionSerialized: json.unsignedTransactionSerialized || null,
      requiredSigners: json.requiredSigners || [],
      recentBlockhash: json.recentBlockhash || null,
    }, null, 2), 'utf8');
    console.log('Wrote unsigned payload to', OUT);
    console.log('Wrote payload metadata to', META_OUT);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
