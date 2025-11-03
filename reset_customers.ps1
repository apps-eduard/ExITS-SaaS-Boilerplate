# Reset Test Customer Accounts Script
# Re-runs the initial data seed to recreate default users with password: Admin@123
# ⚠️ This will reset tenants, roles, and baseline fixtures. Use only in local/dev environments.

Write-Host "Rebuilding baseline seed data..." -ForegroundColor Cyan
Write-Host ""

# Change to API directory
Set-Location -Path "$PSScriptRoot\api"

# Re-run the initial data seed (resets tenants/users/customers)
Write-Host "Running initial data seed (01_initial_data.js)..." -ForegroundColor Yellow
npx knex seed:run --specific=01_initial_data.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Baseline data reset complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test Login Credentials:" -ForegroundColor Cyan
    Write-Host "   Default Password: Admin@123" -ForegroundColor White
    Write-Host ""
    Write-Host "   Test Accounts:" -ForegroundColor Cyan
    Write-Host "   1. customer1@acme.com       - Maria Santos" -ForegroundColor White
    Write-Host "   2. customer1@techstart.com  - Juan Dela Cruz" -ForegroundColor White
    Write-Host ""
    Write-Host "   Login URL: http://localhost:4200/customer/login" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Seed execution failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Return to root directory
Set-Location -Path $PSScriptRoot
