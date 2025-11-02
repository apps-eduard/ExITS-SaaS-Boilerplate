const knex = require('knex')({
  client: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'admin',
    database: 'exits_saas_db'
  }
});

async function updateLoan() {
  try {
    // Calculate total paid for loan ID 2
    const payments = await knex('money_loan_payments').where({ loan_id: 2, status: 'completed' });
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    console.log('Total paid:', totalPaid);

    // Update the loan
    await knex('money_loan_loans')
      .where({ id: 2 })
      .update({ amount_paid: totalPaid });

    console.log('Updated loan amount_paid');

    // Verify the update
    const loan = await knex('money_loan_loans').where({ id: 2 }).first();
    console.log('Updated loan:', {
      amount_paid: loan.amount_paid,
      outstanding_balance: loan.outstanding_balance
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await knex.destroy();
    process.exit(0);
  }
}

updateLoan();