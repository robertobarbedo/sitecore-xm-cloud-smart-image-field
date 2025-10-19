# PowerShell script to restart the dev server cleanly
# Run this if you get permission errors with .next directory

Write-Host "🔄 Restarting development server..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop all Node processes
Write-Host "1. Stopping all Node.js processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "   ✅ All Node processes stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Clean .next directory
Write-Host "2. Cleaning .next directory..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}
Write-Host "   ✅ .next directory cleaned" -ForegroundColor Green
Write-Host ""

# Step 3: Start dev server
Write-Host "3. Starting development server..." -ForegroundColor Yellow
Write-Host "   Please wait for 'Ready' message..." -ForegroundColor Gray
Write-Host ""
npm run dev

