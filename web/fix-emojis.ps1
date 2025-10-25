# Fix all corrupted emojis in role-editor.component.ts with proper UTF-8 encoding
$filePath = ".\src\app\features\admin\roles\role-editor.component.ts"

# Read file with UTF-8 encoding
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

Write-Host "🔧 Fixing corrupted emojis..." -ForegroundColor Cyan

# Fix quick selection buttons
$content = $content -replace "areAllSystemSelected\(\) \? '[^']*Unselect[^']*' : '[^']*Select System[^']*'", "areAllSystemSelected() ? '❌ Unselect System' : '⚡ Select System'"
$content = $content -replace "areAllTenantSelected\(\) \? '[^']*Unselect[^']*' : '[^']*Select Tenant Core'", "areAllTenantSelected() ? '❌ Unselect Tenant Core' : '🏠 Select Tenant Core'"
$content = $content -replace "areAllMoneyLoanSelected\(\) \? '[^']*Unselect[^']*' : '[^']*Select Money Loan'", "areAllMoneyLoanSelected() ? '❌ Unselect Money Loan' : '💰 Select Money Loan'"

Write-Host "✅ Fixed quick selection buttons" -ForegroundColor Green

# Fix Save/Create button
$content = $content -replace "isEditing\(\) \? '[^']*Update' : '[^']*Create'", "isEditing() ? '💾 Update' : '✅ Create'"
Write-Host "✅ Fixed Save/Create button" -ForegroundColor Green

# Fix Cancel button - add icon
$content = $content -replace ">Cancel<", ">❌ Cancel<"
Write-Host "✅ Fixed Cancel button" -ForegroundColor Green

# Fix error icon
$content = $content -replace "âŒ ", "❌ "

# Fix bullet points
$content = $content -replace "â€¢", "•"

# Save file with UTF-8 encoding (with BOM to ensure proper encoding)
$utf8WithBom = New-Object System.Text.UTF8Encoding $true
[System.IO.File]::WriteAllText($filePath, $content, $utf8WithBom)

Write-Host "`n✅ All emojis fixed successfully!" -ForegroundColor Green
Write-Host "   - Quick selection: ⚡ 🏠 💰 ❌" -ForegroundColor Yellow
Write-Host "   - Save/Cancel: 💾 ✅ ❌" -ForegroundColor Yellow
