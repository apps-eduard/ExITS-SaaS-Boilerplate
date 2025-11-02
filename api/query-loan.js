const knex = require('knex')({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'exits_saas_db',
  }
});

async function queryLoan() {
  try {
    const loan = await knex('money_loan_loans')
      .where('loan_number', 'LOAN-1-1762057993471')
      .select('*')
      .first();

    if (loan) {
      console.log('Loan found:');
      console.log(JSON.stringify(loan, null, 2));
    } else {
      console.log('Loan not found');
    }

    // Also check repayment schedule (generated dynamically)
    console.log('\nRepayment Schedule:');
    console.log('Note: Repayment schedule is generated dynamically, not stored in database');
    console.log('See debug-schedule.js for the actual generated schedule');

    // Check payments
    const payments = await knex('money_loan_payments')
      .where('loan_id', loan?.id)
      .select('*')
      .orderBy('payment_date', 'desc');

    console.log('\nPayments:');
    console.log(JSON.stringify(payments, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await knex.destroy();
  }
}

queryLoan();