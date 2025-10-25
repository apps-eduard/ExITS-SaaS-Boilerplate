const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'features', 'admin', 'roles', 'role-editor.component.ts');

let content = fs.readFileSync(filePath, 'utf8');

// Replace all occurrences of spaceFilter with filterState().space in the quick selection buttons
content = content.replace(
  /\*ngIf="spaceFilter === 'all' \|\| spaceFilter === 'system'"/g,
  "*ngIf=\"filterState().space === 'all' || filterState().space === 'system'\""
);

content = content.replace(
  /\*ngIf="spaceFilter === 'all' \|\| spaceFilter === 'tenant'"/g,
  "*ngIf=\"filterState().space === 'all' || filterState().space === 'tenant'\""
);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Quick selection buttons updated successfully');
console.log('   - Replaced spaceFilter with filterState().space');
console.log('   - All 3 button visibility conditions fixed');
