$file = "role-editor.component.ts"
$content = Get-Content $file -Raw -Encoding UTF8

# Update System Level icons (change to ⚡)
$content = $content -replace "displayName: '📊 Dashboard', description: 'System dashboard access'", "displayName: '⚡ Dashboard', description: 'System dashboard - platform metrics'"
$content = $content -replace "displayName: '🏢 Tenants', description: 'Manage tenant organizations'", "displayName: '⚡ Tenants', description: 'Manage all tenant organizations'"
$content = $content -replace "displayName: '👥 Users', description: 'System-wide user management'", "displayName: '⚡ Users', description: 'Platform-wide user management'"
$content = $content -replace "displayName: '🔑 Roles', description: 'System role management'", "displayName: '⚡ Roles', description: 'System role management'"
$content = $content -replace "displayName: '🧩 Modules', description: 'System module management'", "displayName: '⚡ Modules', description: 'System module management'"
$content = $content -replace "displayName: '� Permissions', description: 'Permission management'", "displayName: '⚡ Permissions', description: 'Permission system management'"
$content = $content -replace "displayName: '📦 Products', description: 'Product catalog and management'", "displayName: '⚡ Products', description: 'Product catalog management'"
$content = $content -replace "displayName: '💳 Subscriptions', description: 'Subscription management'", "displayName: '⚡ Subscriptions', description: 'Subscription plan management'"
$content = $content -replace "displayName: '📈 Reports & Analytics', description: 'System reports and analytics'", "displayName: '⚡ Reports', description: 'Platform reports & analytics'"
$content = $content -replace "displayName: '📊 Analytics', description: 'Analytics dashboard'", "displayName: '⚡ Analytics', description: 'Platform analytics dashboard'"
$content = $content -replace "displayName: '🗑️ Recycle Bin', description: 'Deleted items recovery'", "displayName: '⚡ Recycle Bin', description: 'System-wide deleted items'"
$content = $content -replace "displayName: '📋 Audit', description: 'System audit logs'", "displayName: '⚡ Audit Logs', description: 'Platform audit logs'"
$content = $content -replace "displayName: '⚙️ Settings', description: 'System settings'", "displayName: '⚡ Settings', description: 'Platform configuration'"

# Remove obsolete system permissions (loans, payments - these don't exist in system space)
$content = $content -replace "\s*\{ resource: 'loans', displayName: '💵 Loans',[^\}]+\},?\s*", "`n"
$content = $content -replace "\s*\{ resource: 'payments', displayName: '💳 Payments',[^\}]+\},?\s*", "`n"

# Update Tenant Level icons (change to 🏢)
$content = $content -replace "displayName: '🏠 Tenant Dashboard'", "displayName: '🏢 Tenant Dashboard'"
$content = $content -replace "displayName: '👤 Tenant Users'", "displayName: '🏢 Tenant Users'"
$content = $content -replace "displayName: '🎭 Tenant Roles'", "displayName: '🏢 Tenant Roles'"
$content = $content -replace "displayName: '🎁 Tenant Products'", "displayName: '🏢 Tenant Products'"
$content = $content -replace "displayName: '💳 Tenant Billing'", "displayName: '🏢 Tenant Billing'"
$content = $content -replace "displayName: '📋 Tenant Reports'", "displayName: '🏢 Tenant Reports'"
$content = $content -replace "displayName: '♻️ Tenant Recycle Bin'", "displayName: '🏢 Tenant Recycle Bin'"
$content = $content -replace "displayName: '🔧 Tenant Settings'", "displayName: '🏢 Tenant Settings'"

# Update comment
$content = $content -replace "// System level", "// System level - Platform Administration (⚡ = System Power)"
$content = $content -replace "// Tenant level - keeping all UI structure but matching DB permission keys", "// Tenant level - Tenant-Scoped Operations (🏢 = Tenant Space)"

Set-Content $file -Value $content -Encoding UTF8 -NoNewline

Write-Host "✅ Updated role-editor.component.ts with distinct icons" -ForegroundColor Green
Write-Host "   ⚡ System Space: 13 resources (removed obsolete loans, payments)" -ForegroundColor Cyan
Write-Host "   🏢 Tenant Space: 8 core resources + products" -ForegroundColor Cyan
