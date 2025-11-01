/**
 * Add MFA (Multi-Factor Authentication) columns to users table
 */

exports.up = async function(knex) {
  await knex.schema.table('users', function(table) {
    // MFA enabled flag
    table.boolean('mfa_enabled').defaultTo(false)
      .comment('Whether MFA is enabled for this user');
    
    // MFA secret key (encrypted TOTP secret)
    table.string('mfa_secret', 255)
      .comment('Encrypted TOTP secret for authenticator apps');
    
    // Backup codes for MFA recovery (JSON array of hashed codes)
    table.jsonb('mfa_backup_codes')
      .comment('Hashed backup codes for MFA recovery');
    
    // When MFA was enabled
    table.timestamp('mfa_enabled_at')
      .comment('Timestamp when MFA was first enabled');
  });

  console.log('✅ Added MFA columns to users table');
};

exports.down = async function(knex) {
  await knex.schema.table('users', function(table) {
    table.dropColumn('mfa_enabled');
    table.dropColumn('mfa_secret');
    table.dropColumn('mfa_backup_codes');
    table.dropColumn('mfa_enabled_at');
  });

  console.log('✅ Removed MFA columns from users table');
};
