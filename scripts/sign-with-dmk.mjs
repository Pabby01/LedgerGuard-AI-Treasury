#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DeviceManagementKit } from '@ledgerhq/device-management-kit';
import { SignerSolanaBuilder } from '@ledgerhq/device-signer-kit-solana';
import { ContextModule } from '@ledgerhq/device-management-kit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Sign a Solana transaction using Ledger DMK
 * Usage: node sign-with-dmk.mjs <path-to-payload.json>
 * Example: node sign-with-dmk.mjs ./transaction-7.unsigned.payload.json
 */

async function signTransaction(payloadPath) {
  try {
    // Read payload file
    if (!fs.existsSync(payloadPath)) {
      throw new Error(`Payload file not found: ${payloadPath}`);
    }

    const payloadData = JSON.parse(fs.readFileSync(payloadPath, 'utf-8'));
    console.log('✓ Loaded payload:', payloadPath);
    console.log('  TX ID:', payloadData.txId);
    console.log('  Signers:', payloadData.requiredSigners);
    console.log('  Expires:', payloadData.payloadExpiresAt);

    // Decode base64 transaction
    const unsignedTxBytes = Buffer.from(payloadData.unsignedTransaction, 'base64');
    console.log('\n✓ Decoded unsigned transaction:', unsignedTxBytes.length, 'bytes');

    // Initialize DMK
    console.log('\n⏳ Initializing Ledger Device Management Kit...');
    const dmk = new DeviceManagementKit();
    const contextModule = new ContextModule();

    // Discover devices
    console.log('⏳ Discovering Ledger devices...');
    const deviceIds = await dmk.list();
    
    if (deviceIds.length === 0) {
      throw new Error(
        'No Ledger devices found. Please:\n' +
        '  1. Connect a Ledger device via USB, OR\n' +
        '  2. Start Speculos emulator first: npm run speculos:start'
      );
    }

    console.log('✓ Found device:', deviceIds[0]);

    // Connect to device
    const sessionId = deviceIds[0];
    const device = dmk.getDevice(sessionId);
    
    console.log('✓ Connected to device');
    console.log('\n⏳ Opening Solana app on device... (approve on your device)');

    // Create Solana signer
    const solanaBuilder = new SignerSolanaBuilder({
      dmk,
      sessionId,
      solanaRPCURL: 'https://api.devnet.solana.com/',
    });
    const signer = solanaBuilder.build();

    // Sign transaction (derivation path for Solana account 0)
    const derivationPath = "m/44'/501'/0'/0'";
    console.log('  Derivation path:', derivationPath);

    const { observable } = signer.signTransaction(
      derivationPath,
      new Uint8Array(unsignedTxBytes),
      { skipOpenApp: false }
    );

    // Wait for signature
    const signature = await new Promise((resolve, reject) => {
      const subscription = observable.subscribe({
        next: (state) => {
          if (state.status === 'pending') {
            console.log('⏳ Pending user approval on device...');
          } else if (state.status === 'completed') {
            resolve(state.output);
          } else if (state.status === 'error') {
            reject(new Error(`Signing failed: ${state.error?.message || 'unknown error'}`));
          }
        },
        error: (err) => reject(err),
      });
    });

    console.log('\n✓ Transaction signed!');
    console.log('  Signature (64 bytes):', Buffer.from(signature).toString('hex').substring(0, 32) + '...');

    // Format output: signature bytes + unsigned tx bytes (Solana wire format)
    const signatureB64 = Buffer.from(signature).toString('base64');
    
    // Output signed transaction file
    const outputFile = payloadPath.replace('.unsigned.payload.json', '.signed.txt');
    fs.writeFileSync(outputFile, signatureB64, 'utf-8');
    
    console.log('\n✓ Signed transaction saved to:', outputFile);
    console.log('\nNext steps:');
    console.log(`  1. Upload signed transaction: node ./scripts/upload-signed-tx.mjs ${outputFile} ${payloadPath}`);
    console.log(`  2. Or use the UI "Upload Signed Payload" button`);

    return { signatureB64, outputFile };
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  }
}

// Main
const payloadArg = process.argv[2];
if (!payloadArg) {
  console.log('Usage: node sign-with-dmk.mjs <path-to-payload.json>');
  console.log('\nExample:');
  console.log('  node sign-with-dmk.mjs ./transaction-7.unsigned.payload.json');
  process.exit(1);
}

signTransaction(payloadArg);
