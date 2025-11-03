/**
 * Legacy migration placeholder.
 *
 * Original logic moved a batch of permissions into the system scope and granted
 * them to the Super Admin role. The consolidated seed now provisions the same
 * data with correct role assignments, so this file remains only to satisfy the
 * existing Knex migration history.
 */
exports.up = async function up() {
  // Intentionally left blank.
};

exports.down = async function down() {
  // Intentionally left blank.
};
