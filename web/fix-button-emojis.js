const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'features', 'admin', 'roles', 'role-editor.component.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix quick selection button emojis
// System button
content = content.replace(/'â˜ Unselect System Only'/g, "'⚡ Unselect System'");
content = content.replace(/'â˜' Select System Only'/g, "'⚡ Select System'");

// Tenant Core button  
content = content.replace(/'â˜ Unselect Tenant Core'/g, "'❌ Unselect Tenant Core'");
content = content.replace(/'ðŸ  Select Tenant Core'/g, "'🏠 Select Tenant Core'");

// Money Loan button
content = content.replace(/'â˜ Unselect Money Loan'/g, "'❌ Unselect Money Loan'");
content = content.replace(/'ðŸ'° Select Money Loan'/g, "'💰 Select Money Loan'");

// Fix any remaining bullet points
content = content.replace(/â€¢/g, '•');

// Fix error icon
content = content.replace(/âŒ/g, '❌');

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Quick selection button emojis fixed');
console.log('   - System: ⚡ Select/Unselect');
console.log('   - Tenant Core: 🏠 Select / ❌ Unselect');
console.log('   - Money Loan: 💰 Select / ❌ Unselect');
console.log('   - Bullet points: •');
console.log('   - Error icon: ❌');
