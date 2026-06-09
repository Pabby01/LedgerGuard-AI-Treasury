# PowerShell helper (windows)
# Usage: .\sign-and-broadcast.ps1 -ApiBase http://localhost:3000 -UnsignedFile .\transaction-123.unsigned.txt -SignedFile .\transaction-123.signed.txt -TxId 123
param(
  [string]$ApiBase = "http://localhost:3000",
  [string]$UnsignedFile,
  [string]$SignedFile,
  [int]$TxId
)
if (-not $UnsignedFile -or -not $SignedFile -or -not $TxId) {
  Write-Host "Usage: .\sign-and-broadcast.ps1 -ApiBase <api> -UnsignedFile <file> -SignedFile <out> -TxId <id>"
  exit 1
}

# This step assumes you have the Ledger Wallet CLI or DMK installed and available on PATH.
# Replace the example signing command below with the real Wallet CLI command you use.
# Example (pseudo): wallet-cli sign --input-file $UnsignedFile --output-file $SignedFile --derivation "m/44'/501'/0'"

Write-Host "Sign the payload using your Wallet CLI or DMK. Edit this script to match your tool."

# If you have a CLI that outputs base64 signed transaction to stdout, you could pipe it into the SignedFile.
# For now we just check the SignedFile exists.
if (-not (Test-Path $SignedFile)) {
  Write-Host "Signed file not found: $SignedFile"
  exit 1
}

# Read signed base64 and POST to broadcast
$signed = Get-Content -Raw -Path $SignedFile
$body = @{ signedTransaction = $signed }
$json = $body | ConvertTo-Json

$resp = Invoke-RestMethod -Method Post -Uri "$ApiBase/transactions/$TxId/broadcast" -Body $json -ContentType 'application/json'
Write-Host "Broadcast result:`n" ($resp | ConvertTo-Json -Depth 5)
