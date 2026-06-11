# PowerShell helper (windows)
# Usage: .\sign-and-broadcast.ps1 -ApiBase http://localhost:3000 -SignedFile .\transaction-123.signed.txt -TxId 123 -PayloadToken <token>
#    or: .\sign-and-broadcast.ps1 -ApiBase http://localhost:3000 -SignedFile .\transaction-123.signed.txt -TxId 123 -PayloadMetaFile .\transaction-123.unsigned.payload.json
param(
  [string]$ApiBase = "http://localhost:3000",
  [string]$SignedFile,
  [int]$TxId,
  [string]$PayloadToken,
  [string]$PayloadMetaFile
)
if (-not $SignedFile -or -not $TxId) {
  Write-Host "Usage: .\sign-and-broadcast.ps1 -ApiBase <api> -SignedFile <file> -TxId <id> [-PayloadToken <token> | -PayloadMetaFile <file>]"
  exit 1
}

# This step assumes you have the Ledger Wallet CLI or DMK installed and available on PATH.
# Replace the example signing command below with the real Wallet CLI command you use.
# Example (pseudo): wallet-cli sign --input-file $UnsignedFile --output-file $SignedFile --derivation "m/44'/501'/0'"

Write-Host "Sign the payload using your Wallet CLI or DMK. Edit this script to match your tool."

if (-not (Test-Path $SignedFile)) {
  Write-Host "Signed file not found: $SignedFile"
  exit 1
}

if (-not $PayloadToken -and $PayloadMetaFile) {
  if (-not (Test-Path $PayloadMetaFile)) {
    Write-Host "Payload metadata file not found: $PayloadMetaFile"
    exit 1
  }
  try {
    $meta = Get-Content -Raw -Path $PayloadMetaFile | ConvertFrom-Json
    if ($meta -and $meta.payloadToken) {
      $PayloadToken = [string]$meta.payloadToken
    }
  } catch {
    Write-Host "Failed to parse payload metadata file: $PayloadMetaFile"
    exit 1
  }
}

if (-not $PayloadToken) {
  Write-Host "Missing payload token. Provide -PayloadToken or -PayloadMetaFile generated during payload export."
  exit 1
}

# Read signed base64 and POST to broadcast
$signed = (Get-Content -Raw -Path $SignedFile).Trim()
$body = @{ signedTransaction = $signed; payloadToken = $PayloadToken }
$json = $body | ConvertTo-Json

$resp = Invoke-RestMethod -Method Post -Uri "$ApiBase/transactions/$TxId/broadcast" -Body $json -ContentType 'application/json'
Write-Host "Broadcast result:`n" ($resp | ConvertTo-Json -Depth 5)
