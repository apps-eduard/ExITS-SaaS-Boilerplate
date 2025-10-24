const fs = require('fs');

const content = fs.readFileSync('./src/seeds/01_initial_data.js', 'utf8');
const matches = content.match(/permission_key:/g);
console.log(`Total permissions in seed file: ${matches ? matches.length : 0}`);