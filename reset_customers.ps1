# Reset Test Customer Passwords Script
# Resets all test customer passwords to default: Customer@123

Write-Host "Resetting Test Customer Passwords..." -ForegroundColor Cyan
Write-Host ""

# Change to API directory
Set-Location -Path "$PSScriptRoot\api"

# Run the customer portal access seed (which resets passwords)
Write-Host "Running customer password reset seed..." -ForegroundColor Yellow
npx knex seed:run --specific=06_customer_portal_access.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Password reset complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test Customer Login Credentials:" -ForegroundColor Cyan
    Write-Host "   Default Password: Customer@123" -ForegroundColor White
    Write-Host ""
    Write-Host "   Test Accounts:" -ForegroundColor Cyan
    Write-Host "   1. juan.delacruz@test.com   - Juan Dela Cruz" -ForegroundColor White
    Write-Host "   2. maria.santos@test.com    - Maria Santos" -ForegroundColor White
    Write-Host "   3. pedro.gonzales@test.com  - Pedro Gonzales" -ForegroundColor White
    Write-Host ""
    Write-Host "   Login URL: http://localhost:4200/customer/login" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Password reset failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Return to root directory
Set-Location -Path $PSScriptRoot
