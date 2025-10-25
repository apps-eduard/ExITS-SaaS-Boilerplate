const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'features', 'admin', 'roles', 'role-editor.component.ts');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔍 Scanning for corrupted emojis and missing icons...\n');

// Quick Selection Buttons - Fix corrupted emojis
console.log('📝 Fixing Quick Selection Buttons:');
content = content.replace(/'â˜ Unselect System Only'/g, "'❌ Unselect System'");
content = content.replace(/'â˜' Select System Only'/g, "'⚡ Select System'");
content = content.replace(/'â˜ Unselect System'/g, "'❌ Unselect System'");
content = content.replace(/'â˜' Select System'/g, "'⚡ Select System'");
console.log('   ✅ System button: ⚡ Select System / ❌ Unselect System');

content = content.replace(/'â˜ Unselect Tenant Core'/g, "'❌ Unselect Tenant Core'");
content = content.replace(/'ðŸ  Select Tenant Core'/g, "'🏠 Select Tenant Core'");
console.log('   ✅ Tenant Core button: 🏠 Select / ❌ Unselect');

content = content.replace(/'â˜ Unselect Money Loan'/g, "'❌ Unselect Money Loan'");
content = content.replace(/'ðŸ'° Select Money Loan'/g, "'💰 Select Money Loan'");
console.log('   ✅ Money Loan button: 💰 Select / ❌ Unselect');

// Save/Create Button - Fix corrupted emojis
console.log('\n📝 Fixing Save/Create Button:');
content = content.replace(/'ðŸ'¾ Update'/g, "'💾 Update'");
content = content.replace(/'âœ… Create'/g, "'✅ Create'");
console.log('   ✅ Save button: 💾 Update / ✅ Create');

// Cancel Button - Add icon
console.log('\n📝 Adding icon to Cancel Button:');
content = content.replace(/>Cancel</g, '>❌ Cancel<');
console.log('   ✅ Cancel button: ❌ Cancel');

// Clear All button - check if it has icon
if (content.includes('Clear All') && !content.includes('🗑️ Clear All') && !content.includes('❌ Clear All')) {
  content = content.replace(/Clear All/g, '🗑️ Clear All');
  console.log('\n📝 Adding icon to Clear All button:');
  console.log('   ✅ Clear All button: 🗑️ Clear All');
}

// Fix bullet points
console.log('\n📝 Fixing validation bullets:');
content = content.replace(/â€¢/g, '•');
console.log('   ✅ Bullet points fixed: •');

// Fix error icon in error messages
content = content.replace(/âŒ /g, '❌ ');
console.log('   ✅ Error icon fixed: ❌');

// Go to Roles List button - add icon if missing
if (!content.includes('📋 Go to Roles List') && !content.includes('⬅️ Go to Roles List')) {
  content = content.replace(/Go to Roles List/g, '⬅️ Go to Roles List');
  console.log('\n📝 Adding icon to "Go to Roles List" button:');
  console.log('   ✅ Go to Roles List: ⬅️ Go to Roles List');
}

fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ All button emojis fixed and missing icons added!');
console.log('\n📊 Summary:');
console.log('   - Quick selection buttons: ⚡ 🏠 💰 (select) / ❌ (unselect)');
console.log('   - Save button: 💾 Update / ✅ Create');
console.log('   - Cancel button: ❌ Cancel');
console.log('   - Clear All: 🗑️ Clear All');
console.log('   - Bullet points: •');
console.log('   - Error icon: ❌');
