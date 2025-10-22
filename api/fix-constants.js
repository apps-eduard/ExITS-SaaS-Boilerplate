const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'controllers', 'UserController.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all CONSTANTS.HTTP_STATUS with HTTP_STATUS
content = content.replace(/CONSTANTS\.HTTP_STATUS/g, 'HTTP_STATUS');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed all HTTP_STATUS references in UserController.js');
