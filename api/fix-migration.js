const fs = require('fs');
const path = require('path');

const migrationFile = path.join(__dirname, 'src/migrations/20251024085659_create_products_and_subscriptions.js');

let content = fs.readFileSync(migrationFile, 'utf8');

// Replace all enum usage patterns
const replacements = [
  {
    from: "table.enu('billing_cycle', ['monthly', 'quarterly', 'yearly', 'one_time'], { useNative: true, enumName: 'billing_cycle_type' }).defaultTo('monthly')",
    to: "table.specificType('billing_cycle', 'billing_cycle_type').defaultTo('monthly')"
  },
  {
    from: "table.enu('status', ['active', 'inactive', 'deprecated'], { useNative: true, enumName: 'plan_status' }).defaultTo('active')",
    to: "table.specificType('status', 'plan_status').defaultTo('active')"
  },
  {
    from: "table.enu('status', ['active', 'suspended', 'cancelled', 'expired', 'pending'], { useNative: true, enumName: 'subscription_status' }).defaultTo('active')",
    to: "table.specificType('status', 'subscription_status').defaultTo('active')"
  },
  {
    from: "table.enu('product_type', ['money_loan', 'bnpl', 'pawnshop'], { useNative: true, enumName: 'product_type' }).notNullable()",
    to: "table.specificType('product_type', 'product_type').notNullable()"
  },
  {
    from: "table.enu('status', ['active', 'suspended', 'cancelled', 'expired'], { useNative: true, enumName: 'product_subscription_status' }).defaultTo('active')",
    to: "table.specificType('status', 'product_subscription_status').defaultTo('active')"
  },
  {
    from: "table.enu('billing_cycle', ['monthly', 'quarterly', 'yearly', 'one_time'], { useNative: true, enumName: 'billing_cycle_type' }).defaultTo('monthly')",
    to: "table.specificType('billing_cycle', 'billing_cycle_type').defaultTo('monthly')"
  },
  {
    from: "table.enu('status', ['draft', 'sent', 'paid', 'overdue', 'cancelled'], { useNative: true, enumName: 'invoice_status' }).defaultTo('draft')",
    to: "table.specificType('status', 'invoice_status').defaultTo('draft')"
  },
  {
    from: "table.enu('status', ['pending', 'completed', 'failed', 'refunded', 'cancelled'], { useNative: true, enumName: 'payment_status' }).defaultTo('pending')",
    to: "table.specificType('status', 'payment_status').defaultTo('pending')"
  },
  {
    from: "table.enu('status', ['pending', 'processed', 'failed'], { useNative: true }).defaultTo('pending')",
    to: "table.string('status', 20).defaultTo('pending')"
  }
];

replacements.forEach(replacement => {
  content = content.replace(new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.to);
});

fs.writeFileSync(migrationFile, content);
console.log('Migration file updated successfully!');