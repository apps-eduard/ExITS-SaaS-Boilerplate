const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'features', 'admin', 'roles', 'role-editor.component.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the 4 corrupted system resource emojis using Buffer to handle the exact bytes
content = content.replace(/resource: 'dashboard', displayName: '.*? Dashboard'/g, "resource: 'dashboard', displayName: '📊 Dashboard'");
content = content.replace(/resource: 'tenants', displayName: '.*? Tenants'/g, "resource: 'tenants', displayName: '🏢 Tenants'");
content = content.replace(/resource: 'users', displayName: '.*? Users'/g, "resource: 'users', displayName: '👥 Users'");
content = content.replace(/resource: 'roles', displayName: '.*? Roles'/g, "resource: 'roles', displayName: '🔐 Roles'");

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ System resource emojis fixed');
console.log('   - Dashboard: 📊');
console.log('   - Tenants: 🏢');
console.log('   - Users: 👥');
console.log('   - Roles: 🔐');
