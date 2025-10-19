# PowerShell script to set up environment variables
# Run this in PowerShell: .\setup-env.ps1

$envContent = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://uuerpqlqvisllxwevryb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZXJwcWxxdmlzbGx4d2V2cnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNTMyODYsImV4cCI6MjA3NTgyOTI4Nn0._rtFWNZp-ZlwFvlvxTQIZjB8YeH77JtieYXcN6T1j7I
"@

$envPath = ".env.local"

Write-Host "Creating $envPath file..." -ForegroundColor Green
Set-Content -Path $envPath -Value $envContent
Write-Host "✅ Environment file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your dev server: npm run dev" -ForegroundColor White
Write-Host "2. Open your app and upload an image" -ForegroundColor White
Write-Host "3. Check the console for '✅ Saved to Supabase'" -ForegroundColor White

