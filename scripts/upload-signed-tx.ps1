# Upload signed transaction and broadcast on chain
# Usage: ./scripts/upload-signed-tx.ps1 -SignedFile <path> -PayloadFile <path> -ApiBase http://localhost:3000/api
# Example: ./scripts/upload-signed-tx.ps1 -SignedFile ./transaction-7.signed.txt -PayloadFile ./transaction-7.unsigned.payload.json

param(
    [Parameter(Mandatory = $true)]
    [string]$SignedFile,
    
    [Parameter(Mandatory = $true)]
    [string]$PayloadFile,
    
    [Parameter(Mandatory = $false)]
    [string]$ApiBase = "http://localhost:3000/api"
)

function Main {
    try {
        # Read signed transaction
        if (-not (Test-Path $SignedFile)) {
            throw "Signed file not found: $SignedFile"
        }
        $signedTx = Get-Content $SignedFile -Raw
        Write-Host "✓ Loaded signed transaction from: $SignedFile" -ForegroundColor Green
        
        # Read payload metadata (for token)
        if (-not (Test-Path $PayloadFile)) {
            throw "Payload file not found: $PayloadFile"
        }
        $payloadData = Get-Content $PayloadFile | ConvertFrom-Json
        Write-Host "✓ Loaded payload metadata from: $PayloadFile" -ForegroundColor Green
        
        $txId = $payloadData.txId
        $payloadToken = $payloadData.payloadToken
        
        Write-Host "`nTransaction Details:"
        Write-Host "  TX ID: $txId"
        Write-Host "  API: $ApiBase"
        Write-Host "  Token: $($payloadToken.Substring(0, 20))..."
        
        # Build broadcast request
        $uploadUrl = "$ApiBase/transactions/$txId/broadcast"
        $body = @{
            signedTransaction = $signedTx
            payloadToken = $payloadToken
        } | ConvertTo-Json
        
        Write-Host "`n⏳ Uploading signed transaction to: $uploadUrl"
        
        # Send to API
        $response = Invoke-WebRequest `
            -Uri $uploadUrl `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction Stop
        
        $result = $response.Content | ConvertFrom-Json
        
        if ($result.success) {
            Write-Host "`n✓ Broadcast successful!" -ForegroundColor Green
            Write-Host "  Signature: $($result.signature)" -ForegroundColor Cyan
            Write-Host "`nTransaction details:"
            Write-Host "  URL: https://explorer.solana.com/tx/$($result.signature)?cluster=devnet"
            return $true
        } else {
            throw "Broadcast failed: $($result.error)"
        }
    }
    catch {
        Write-Host "`n✗ Error: $_" -ForegroundColor Red
        exit 1
    }
}

Main
