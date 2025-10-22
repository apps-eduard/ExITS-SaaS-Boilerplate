/**
 * Generate Password Hash Script
 * Generates bcrypt hash for default admin password
 */

const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'Admin@123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
}

generateHash();
