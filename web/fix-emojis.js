const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'features', 'admin', 'roles', 'role-editor.component.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix System resources
content = content.replace(/displayName: '.*? Modules'/g, "displayName: '🧩 Modules'");
content = content.replace(/displayName: '.*? Permissions'/g, "displayName: '🔑 Permissions'");
content = content.replace(/resource: 'products', displayName: '.*? Products'/g, "resource: 'products', displayName: '📦 Products'");
content = content.replace(/resource: 'subscriptions', displayName: '.*? Subscriptions'/g, "resource: 'subscriptions', displayName: '💳 Subscriptions'");
content = content.replace(/displayName: '.*? Reports & Analytics'/g, "displayName: '📈 Reports & Analytics'");
content = content.replace(/resource: 'analytics', displayName: '.*? Analytics'/g, "resource: 'analytics', displayName: '📊 Analytics'");
content = content.replace(/resource: 'recycle-bin', displayName: '.*? Recycle Bin'/g, "resource: 'recycle-bin', displayName: '🗑️ Recycle Bin'");
content = content.replace(/resource: 'loans', displayName: '.*? Loans'/g, "resource: 'loans', displayName: '💵 Loans'");
content = content.replace(/resource: 'payments', displayName: '.*? Payments'/g, "resource: 'payments', displayName: '💳 Payments'");
content = content.replace(/resource: 'audit', displayName: '.*? Audit'/g, "resource: 'audit', displayName: '📋 Audit'");
content = content.replace(/resource: 'settings', displayName: '.*? Settings'/g, "resource: 'settings', displayName: '⚙️ Settings'");

// Fix Tenant resources
content = content.replace(/displayName: '.*? Tenant Dashboard'/g, "displayName: '🏠 Tenant Dashboard'");
content = content.replace(/displayName: '.*? Tenant Users'/g, "displayName: '👤 Tenant Users'");
content = content.replace(/displayName: '.*? Tenant Roles'/g, "displayName: '🎭 Tenant Roles'");
content = content.replace(/displayName: '.*? Tenant Products'/g, "displayName: '🎁 Tenant Products'");
content = content.replace(/displayName: '.*? Tenant Billing'/g, "displayName: '💳 Tenant Billing'");
content = content.replace(/displayName: '.*? Tenant Reports'/g, "displayName: '📋 Tenant Reports'");
content = content.replace(/displayName: '.*? Tenant Recycle Bin'/g, "displayName: '♻️ Tenant Recycle Bin'");
content = content.replace(/displayName: '.*? Tenant Settings'/g, "displayName: '🔧 Tenant Settings'");

// Fix Money Loan resources - replace any corrupted emoji before "Money Loan"
content = content.replace(/displayName: '.*? Money Loan:/g, "displayName: '💰 Money Loan:");
content = content.replace(/displayName: '.*? Money Loan \(/g, "displayName: '💰 Money Loan (");

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Emojis fixed successfully');
console.log('   - Fixed System resource emojis');
console.log('   - Fixed Tenant resource emojis');
console.log('   - Fixed Money Loan resource emojis');
