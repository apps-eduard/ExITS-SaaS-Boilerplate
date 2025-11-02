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

async function testRepaymentSchedule() {
  try {
    const loanId = 2;
    const tenantId = 1;

    // Get loan details
    const loan = await knex('money_loan_loans as mll')
      .leftJoin('money_loan_products as mlp', 'mll.loan_product_id', 'mlp.id')
      .select(
        'mll.*',
        'mlp.payment_frequency as product_payment_frequency'
      )
      .where('mll.id', loanId)
      .andWhere('mll.tenant_id', tenantId)
      .first();

    console.log('Loan data:', loan);

    // Get all payments for this loan
    const payments = await knex('money_loan_payments')
      .where({ tenant_id: tenantId, loan_id: loanId })
      .orderBy('payment_date', 'asc');

    console.log('Payments:', payments);

    // Determine payment frequency (daily, weekly, monthly)
    const paymentFrequency = loan.payment_frequency || loan.paymentFrequency || loan.product_payment_frequency || loan.productPaymentFrequency || 'weekly';
    const termDays = loan.term_days || loan.termDays || 30;
    const disbursementDateValue = loan.disbursement_date || loan.disbursementDate;
    const disbursementDate = disbursementDateValue ? new Date(disbursementDateValue) : new Date();

    console.log('Payment frequency:', paymentFrequency);
    console.log('Term days:', termDays);
    console.log('Disbursement date:', disbursementDate);

    // Calculate number of installments based on frequency
    let numberOfInstallments = 1;
    let daysBetweenPayments = termDays;

    if (paymentFrequency === 'daily') {
      numberOfInstallments = termDays;
      daysBetweenPayments = 1;
    } else if (paymentFrequency === 'weekly') {
      numberOfInstallments = Math.ceil(termDays / 7);
      daysBetweenPayments = 7;
    } else if (paymentFrequency === 'monthly') {
      numberOfInstallments = Math.ceil(termDays / 30);
      daysBetweenPayments = 30;
    }

    console.log('Number of installments:', numberOfInstallments);
    console.log('Days between payments:', daysBetweenPayments);

    // Calculate total amount to be repaid (principal + interest)
    // Try both snake_case and camelCase field names
    const principalAmount = parseFloat(loan.principal_amount || loan.principalAmount) || 0;
    const totalInterest = parseFloat(loan.total_interest || loan.totalInterest) || 0;
    const totalAmount = parseFloat(loan.total_amount || loan.totalAmount) || (principalAmount + totalInterest);
    const amountPerInstallment = totalAmount / numberOfInstallments;

    console.log('Principal amount:', principalAmount);
    console.log('Total interest:', totalInterest);
    console.log('Total amount:', totalAmount);
    console.log('Amount per installment:', amountPerInstallment);

    // Generate installment schedule
    const schedule = [];
    let totalPaid = 0;

    // Calculate total paid from payments
    for (const payment of payments) {
      totalPaid += parseFloat(payment.amount) || 0;
    }

    console.log('Total paid:', totalPaid);

    for (let i = 1; i <= numberOfInstallments; i++) {
      const dueDate = new Date(disbursementDate);
      dueDate.setDate(dueDate.getDate() + (i * daysBetweenPayments));

      // Calculate how much of this installment has been paid
      const previousInstallmentsTotal = (i - 1) * amountPerInstallment;
      const thisInstallmentEnd = i * amountPerInstallment;

      let amountPaidForThisInstallment = 0;
      if (totalPaid > previousInstallmentsTotal) {
        amountPaidForThisInstallment = Math.min(
          totalPaid - previousInstallmentsTotal,
          amountPerInstallment
        );
      }

      const remainingForInstallment = amountPerInstallment - amountPaidForThisInstallment;

      // Determine status
      let status = 'pending';
      if (amountPaidForThisInstallment >= amountPerInstallment - 0.01) { // Small tolerance for rounding
        status = 'paid';
      } else if (amountPaidForThisInstallment > 0) {
        status = 'partial';
      } else if (new Date() > dueDate) {
        status = 'overdue';
      }

      console.log(`Installment ${i}: totalDue=${amountPerInstallment.toFixed(2)}, paid=${amountPaidForThisInstallment.toFixed(2)}, status=${status}`);

      schedule.push({
        id: i, // Using installment number as ID since we don't have a separate table
        installmentNumber: i,
        installment_number: i,
        dueDate: dueDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        principalAmount: amountPerInstallment * (principalAmount / totalAmount),
        principal_due: amountPerInstallment * (principalAmount / totalAmount),
        interestAmount: amountPerInstallment * (totalInterest / totalAmount),
        interest_due: amountPerInstallment * (totalInterest / totalAmount),
        totalAmount: amountPerInstallment,
        total_due: amountPerInstallment,
        amountPaid: amountPaidForThisInstallment,
        amount_paid: amountPaidForThisInstallment,
        outstandingAmount: amountPerInstallment - amountPaidForThisInstallment,
        penaltyAmount: 0,
        status: status === 'partial' ? 'partially_paid' : status,
        daysOverdue: status === 'overdue' ? Math.max(0, Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))) : 0
      });
    }

    console.log('Generated schedule:', schedule);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await knex.destroy();
  }
}

testRepaymentSchedule();