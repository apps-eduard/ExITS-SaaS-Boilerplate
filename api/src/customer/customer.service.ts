import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { KnexService } from '../database/knex.service';
import { CustomerLoginDto } from './dto/customer-auth.dto';
import bcrypt from 'bcrypt';

@Injectable()
export class CustomerService {
  constructor(
    private knexService: KnexService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: CustomerLoginDto) {
    const knex = this.knexService.instance;

    // Query customer record (main SaaS customer table)
    // and join with money_loan_customer_profiles (loan-specific KYC/credit data)
    const customerRecord = await knex('customers')
      .select(
        'customers.*',
        'users.email as userEmail',
        'users.password_hash as passwordHash',
        'users.id as userId',
        // Loan profile fields from money_loan_customer_profiles
        'money_loan_customer_profiles.kyc_status as loanProfileKycStatus',
        'money_loan_customer_profiles.credit_score as loanProfileCreditScore',
        'money_loan_customer_profiles.risk_level as loanProfileRiskLevel',
        'tenants.name as tenantName',
        'tenants.subdomain as tenantSubdomain'
      )
      .leftJoin('users', 'customers.user_id', 'users.id')
      .leftJoin('money_loan_customer_profiles', 'customers.id', 'money_loan_customer_profiles.customer_id')
      .leftJoin('tenants', 'customers.tenant_id', 'tenants.id')
      .where(function() {
        this.where('customers.email', loginDto.identifier)
          .orWhere('customers.phone', loginDto.identifier);
      })
      .whereNotNull('customers.user_id')
      .where('customers.status', 'active')
      .first();

    if (!customerRecord || !customerRecord.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(loginDto.password, customerRecord.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokenExpiry = loginDto.rememberMe ? '30d' : '1d';
    const customerPermissions = [
      'money-loan:read',
      'money-loan:payments',
      'money-loan:create',
    ];
    const payload = {
      userId: customerRecord.userId,
      customerId: customerRecord.id, // customers.id (main SaaS customer ID)
      tenantId: customerRecord.tenantId,
      type: 'customer',
      permissions: customerPermissions,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: tokenExpiry });

    // Hash the token for storage
    const tokenHash = await bcrypt.hash(accessToken, 10);

    await knex('user_sessions').insert({
      user_id: customerRecord.userId,
      token_hash: tokenHash,
      status: 'active',
      expires_at: new Date(Date.now() + (loginDto.rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000),
      user_agent: 'Customer Portal',
    });

    const customerData = { ...customerRecord };
    delete customerData.passwordHash;

    return {
      success: true,
      message: 'Login successful',
      data: {
        tokens: {
          accessToken,
          refreshToken: accessToken, // TODO: Implement proper refresh token
        },
        customer: {
          ...customerData,
          permissions: customerPermissions,
        },
        user: {
          id: customerRecord.id.toString(),
          email: customerRecord.email || customerRecord.userEmail,
          firstName: customerRecord.firstName || customerRecord.first_name,
          lastName: customerRecord.lastName || customerRecord.last_name,
          role: 'customer',
          tenant: {
            id: customerRecord.tenantId?.toString(),
            name: customerRecord.tenantName,
          },
          permissions: customerPermissions,
        },
      },
    };
  }

  async getProfile(customerId: number, tenantId: number) {
    const knex = this.knexService.instance;

    // Get customer record (main SaaS customer table)
    // with loan profile data (money_loan_customer_profiles)
    const customerProfile = await knex('customers')
      .select(
        'customers.*',
        // Loan-specific profile fields
        'money_loan_customer_profiles.kyc_status as loanProfileKycStatus',
        'money_loan_customer_profiles.credit_score as loanProfileCreditScore',
        'money_loan_customer_profiles.risk_level as loanProfileRiskLevel',
        'money_loan_customer_profiles.employment_status as loanProfileEmploymentStatus',
        'money_loan_customer_profiles.monthly_income as loanProfileMonthlyIncome'
      )
      .leftJoin('money_loan_customer_profiles', 'customers.id', 'money_loan_customer_profiles.customer_id')
      .where({ 'customers.id': customerId, 'customers.tenant_id': tenantId })
      .first();

    if (!customerProfile) {
      throw new NotFoundException('Customer not found');
    }

    return customerProfile;
  }

  async getLoans(customerId: number, tenantId: number) {
    const knex = this.knexService.instance;

    return await knex('money_loan_loans')
      .select(
        'money_loan_loans.*',
        'money_loan_products.name as productName',
        'money_loan_products.interest_rate as productInterestRate'
      )
      .leftJoin('money_loan_products', 'money_loan_loans.loan_product_id', 'money_loan_products.id')
      .where({
        'money_loan_loans.customer_id': customerId,
        'money_loan_loans.tenant_id': tenantId,
      })
      .orderBy('money_loan_loans.created_at', 'desc');
  }

  async getLoansById(userId: number) {
    const knex = this.knexService.instance;

    // Resolve user → customer relationship
    // Note: userId from mobile app → users.id → customers.user_id → customers.id
    const userWithCustomer = await knex('users')
      .select('users.tenant_id', 'customers.id as customer_id')
      .leftJoin('customers', 'users.id', 'customers.user_id')
      .where({ 'users.id': userId })
      .first();

    if (!userWithCustomer) {
      throw new NotFoundException('User not found');
    }

    // Knex converts snake_case to camelCase
    // customers.id is the main SaaS customer ID
    const mainCustomerId = userWithCustomer.customerId;
    
    if (!mainCustomerId) {
      throw new NotFoundException('Customer record not found for this user');
    }

    console.log(`🔍 getLoansById - User ID: ${userId}, Main Customer ID: ${mainCustomerId}, Tenant ID: ${userWithCustomer.tenantId}`);

    // Query loans using customers.id (money_loan_loans.customer_id references customers.id)
    const loans = await knex('money_loan_loans')
      .select(
        'money_loan_loans.*',
        'money_loan_products.name as productName',
        'money_loan_products.interest_rate as productInterestRate'
      )
      .leftJoin('money_loan_products', 'money_loan_loans.loan_product_id', 'money_loan_products.id')
      .where({
        'money_loan_loans.customer_id': mainCustomerId, // References customers.id
        'money_loan_loans.tenant_id': userWithCustomer.tenantId,
      })
      .orderBy('money_loan_loans.created_at', 'desc');

    console.log(`📊 getLoansById - Found ${loans.length} loans for customer ${mainCustomerId}`);
    
    return loans;
  }

  async getApplications(customerId: number, tenantId: number) {
    const knex = this.knexService.instance;

    return await knex('money_loan_applications')
      .select(
        'money_loan_applications.*',
        'money_loan_products.name as productName'
      )
      .leftJoin('money_loan_products', 'money_loan_applications.loan_product_id', 'money_loan_products.id')
      .where({
        'money_loan_applications.customer_id': customerId,
        'money_loan_applications.tenant_id': tenantId,
      })
      .orderBy('money_loan_applications.created_at', 'desc');
  }

  async getPayments(customerId: number, tenantId: number, loanId?: number) {
    const knex = this.knexService.instance;

    console.log(`📋 getPayments - Customer ID: ${customerId}, Tenant ID: ${tenantId}, Loan ID: ${loanId}`);

    // Validate customerId
    if (!customerId) {
      throw new NotFoundException('Customer ID is required');
    }

    let query = knex('money_loan_payments')
      .select('money_loan_payments.*', 'money_loan_loans.loan_number as loanNumber')
      .join('money_loan_loans', 'money_loan_payments.loan_id', 'money_loan_loans.id')
      .where('money_loan_loans.customer_id', customerId)
      .where('money_loan_loans.tenant_id', tenantId)
      .orderBy('money_loan_payments.created_at', 'desc');

    if (loanId) {
      query = query.where('money_loan_payments.loan_id', loanId);
    }

    const payments = await query;
    console.log(`💳 Found ${payments.length} payments for customer ${customerId}`);
    
    return payments;
  }

  async getDashboard(userId: number) {
    const knex = this.knexService.instance;

    // Resolve user → customer relationship
    // Note: userId from mobile app → users.id → customers.user_id → customers.id
    const userWithCustomer = await knex('users')
      .select('users.*', 'users.tenant_id', 'customers.id as customer_id')
      .leftJoin('customers', 'users.id', 'customers.user_id')
      .where({ 'users.id': userId })
      .first();

    if (!userWithCustomer) {
      throw new NotFoundException('User not found');
    }

    // Knex converts snake_case to camelCase
    // customers.id is the main SaaS customer ID
    const mainCustomerId = userWithCustomer.customerId;
    
    if (!mainCustomerId) {
      throw new NotFoundException('Customer record not found for this user');
    }

    const tenantId = userWithCustomer.tenantId;

    console.log(`🔍 getDashboard - User ID: ${userId}, Main Customer ID: ${mainCustomerId}, Tenant ID: ${tenantId}`);

    // Get all loans for this customer (money_loan_loans.customer_id references customers.id)
    const loans = await knex('money_loan_loans')
      .where({
        'customer_id': mainCustomerId, // References customers.id
        'tenant_id': tenantId,
      });

    console.log(`📊 getDashboard - Found ${loans.length} loans for customer ${mainCustomerId}`);

    // Calculate dashboard stats
    const totalLoans = loans.length;
    const activeLoans = loans.filter(loan => 
      ['active', 'approved', 'disbursed'].includes(loan.status)
    ).length;
    
    const totalBorrowed = loans.reduce((sum, loan) => {
      const principal = loan.principal_amount ?? loan.principalAmount ?? 0;
      return sum + parseFloat(principal);
    }, 0);
    const totalPaid = loans.reduce((sum, loan) => {
      const paid = loan.total_paid ?? loan.totalPaid ?? loan.amount_paid ?? loan.amountPaid ?? 0;
      return sum + parseFloat(paid);
    }, 0);
    const remainingBalance = loans.reduce((sum, loan) => {
      const balance = loan.outstanding_balance ?? loan.outstandingBalance ?? 0;
      return sum + parseFloat(balance);
    }, 0);

    // Get next payment info for this customer
    const nextPayment = await knex('money_loan_repayment_schedules as schedule')
      .join('money_loan_loans as loans', 'schedule.loan_id', 'loans.id')
      .select(
        'schedule.due_date',
        'schedule.total_amount',
        'schedule.outstanding_amount'
      )
      .where('loans.customer_id', mainCustomerId) // References customers.id
      .andWhere('loans.tenant_id', tenantId)
      .andWhere(builder =>
        builder.whereIn('schedule.status', ['pending', 'partially_paid'])
      )
      .orderBy('schedule.due_date', 'asc')
      .first();

    // Get recent loans for this customer
    const recentLoans = await knex('money_loan_loans')
      .select(
        'money_loan_loans.*',
        'money_loan_products.name as productName'
      )
      .leftJoin('money_loan_products', 'money_loan_loans.loan_product_id', 'money_loan_products.id')
      .where({
        'money_loan_loans.customer_id': mainCustomerId, // References customers.id
        'money_loan_loans.tenant_id': tenantId,
      })
      .orderBy('money_loan_loans.created_at', 'desc')
      .limit(5);

    return {
      totalLoans,
      activeLoans,
      totalBorrowed,
      totalPaid,
      remainingBalance,
      nextPaymentAmount: nextPayment
        ? parseFloat(
            (nextPayment.outstanding_amount ??
              nextPayment.outstandingAmount ??
              nextPayment.total_amount ??
              nextPayment.totalAmount ??
              0) as any,
          )
        : 0,
      nextPaymentDate:
        nextPayment?.due_date ?? nextPayment?.dueDate ?? null,
      recentLoans: recentLoans.map(loan => ({
        id: loan.id,
        loanNumber: loan.loan_number ?? loan.loanNumber,
        amount: loan.principal_amount ?? loan.principalAmount,
        balance: loan.outstanding_balance ?? loan.outstandingBalance,
        status: loan.status,
        productName: loan.productName,
        dueDate:
          loan.next_payment_date ??
          loan.nextPaymentDate ??
          loan.maturity_date ??
          loan.maturityDate,
      })),
    };
  }

  async getDashboardByCustomerId(customerId: number, tenantId: number) {
    const knex = this.knexService.instance;

    console.log(`🔍 getDashboardByCustomerId - Customer ID: ${customerId}, Tenant ID: ${tenantId}`);

    // Get all loans for this customer (money_loan_loans.customer_id references customers.id)
    const loans = await knex('money_loan_loans')
      .where({
        'customer_id': customerId, // References customers.id
        'tenant_id': tenantId,
      });

    console.log(`📊 getDashboardByCustomerId - Found ${loans.length} loans for customer ${customerId}`);

    // Calculate dashboard stats
    const totalLoans = loans.length;
    const activeLoans = loans.filter(loan => 
      ['active', 'approved', 'disbursed'].includes(loan.status)
    ).length;
    
    const totalBorrowed = loans.reduce((sum, loan) => {
      const principal = loan.principal_amount ?? loan.principalAmount ?? 0;
      return sum + parseFloat(principal);
    }, 0);
    const totalPaid = loans.reduce((sum, loan) => {
      const paid = loan.total_paid ?? loan.totalPaid ?? loan.amount_paid ?? loan.amountPaid ?? 0;
      return sum + parseFloat(paid);
    }, 0);
    const remainingBalance = loans.reduce((sum, loan) => {
      const balance = loan.outstanding_balance ?? loan.outstandingBalance ?? 0;
      return sum + parseFloat(balance);
    }, 0);

    // Get next payment info for this customer
    const nextPayment = await knex('money_loan_repayment_schedules as schedule')
      .join('money_loan_loans as loans', 'schedule.loan_id', 'loans.id')
      .select(
        'schedule.due_date',
        'schedule.total_amount',
        'schedule.outstanding_amount'
      )
      .where('loans.customer_id', customerId) // References customers.id
      .andWhere('loans.tenant_id', tenantId)
      .andWhere(builder =>
        builder.whereIn('schedule.status', ['pending', 'partially_paid'])
      )
      .orderBy('schedule.due_date', 'asc')
      .first();

    // Get recent loans for this customer
    const recentLoans = await knex('money_loan_loans')
      .select(
        'money_loan_loans.*',
        'money_loan_products.name as productName'
      )
      .leftJoin('money_loan_products', 'money_loan_loans.loan_product_id', 'money_loan_products.id')
      .where({
        'money_loan_loans.customer_id': customerId, // References customers.id
        'money_loan_loans.tenant_id': tenantId,
      })
      .orderBy('money_loan_loans.created_at', 'desc')
      .limit(5);

    return {
      totalLoans,
      activeLoans,
      totalBorrowed,
      totalPaid,
      remainingBalance,
      nextPaymentAmount: nextPayment
        ? parseFloat(
            (nextPayment.outstanding_amount ??
              nextPayment.outstandingAmount ??
              nextPayment.total_amount ??
              nextPayment.totalAmount ??
              0) as any,
          )
        : 0,
      nextPaymentDate:
        nextPayment?.due_date ?? nextPayment?.dueDate ?? null,
      recentLoans: recentLoans.map(loan => ({
        id: loan.id,
        loanNumber: loan.loan_number ?? loan.loanNumber,
        amount: loan.principal_amount ?? loan.principalAmount,
        balance: loan.outstanding_balance ?? loan.outstandingBalance,
        status: loan.status,
        productName: loan.productName,
        dueDate:
          loan.next_payment_date ??
          loan.nextPaymentDate ??
          loan.maturity_date ??
          loan.maturityDate,
      })),
    };
  }

  async getLoanDetailsByCustomerId(customerId: number, tenantId: number, loanId: number) {
    const knex = this.knexService.instance;

    console.log(`🔍 getLoanDetailsByCustomerId - Customer ID: ${customerId}, Tenant ID: ${tenantId}, Loan ID: ${loanId}`);

    // Get loan details with product information
    const loan = await knex('money_loan_loans')
      .select(
        'money_loan_loans.*',
        'money_loan_products.name as productName',
        'money_loan_products.interest_rate as productInterestRate',
        'money_loan_products.interest_type as productInterestType',
        'money_loan_products.description as productDescription',
        'money_loan_products.min_amount as productMinAmount',
        'money_loan_products.max_amount as productMaxAmount'
      )
      .leftJoin('money_loan_products', 'money_loan_loans.loan_product_id', 'money_loan_products.id')
      .where({
        'money_loan_loans.id': loanId,
        'money_loan_loans.customer_id': customerId,
        'money_loan_loans.tenant_id': tenantId,
      })
      .first();

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    console.log(`🔍 Found loan ${loanId} for customer ${customerId}`);

    // Get payment history
    const payments = await knex('money_loan_payments')
      .where({
        'loan_id': loanId,
        'tenant_id': tenantId,
      })
      .orderBy('payment_date', 'desc');

    console.log(`💳 Payment history query result: ${payments.length} records`);

    // Generate repayment schedule dynamically (same logic as MoneyLoanService)
    const paymentFrequency = loan.payment_frequency || loan.paymentFrequency || 'weekly';
    const termDays = loan.term_days || loan.termDays || 30;
    const disbursementDateValue = loan.disbursement_date || loan.disbursementDate;
    const disbursementDate = disbursementDateValue ? new Date(disbursementDateValue) : new Date();
    
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

    // Calculate total amount to be repaid (principal + interest)
    const principalAmount = parseFloat(loan.principal_amount || loan.principalAmount || '0');
    const totalInterest = parseFloat(loan.total_interest || loan.totalInterest || '0');
    const totalAmount = parseFloat(loan.total_amount || loan.totalAmount || '0') || (principalAmount + totalInterest);
    const amountPerInstallment = totalAmount / numberOfInstallments;

    console.log(`📅 Schedule calculation: ${numberOfInstallments} ${paymentFrequency} installments, ${amountPerInstallment} each`);

    // Calculate total paid from payments
    let totalPaid = 0;
    for (const payment of payments) {
      totalPaid += parseFloat(payment.amount || '0');
    }

    console.log(`💰 Total paid from ${payments.length} payments: ${totalPaid}`);

    // Generate installment schedule
    const scheduleData = [];
    for (let i = 1; i <= numberOfInstallments; i++) {
      const dueDate = new Date(disbursementDate);
      dueDate.setDate(dueDate.getDate() + (i * daysBetweenPayments));

      // Calculate how much of this installment has been paid
      const previousInstallmentsTotal = (i - 1) * amountPerInstallment;
      const thisInstallmentEnd = i * amountPerInstallment;
      
      let amountPaidForThisInstallment = 0;
      let status = 'pending';
      
      if (totalPaid >= thisInstallmentEnd) {
        amountPaidForThisInstallment = amountPerInstallment;
        status = 'paid';
      } else if (totalPaid > previousInstallmentsTotal) {
        amountPaidForThisInstallment = totalPaid - previousInstallmentsTotal;
        status = 'partial';
      }

      // Check if overdue
      const today = new Date();
      if (status !== 'paid' && dueDate < today) {
        status = 'overdue';
      }

      const principalForInstallment = principalAmount / numberOfInstallments;
      const interestForInstallment = totalInterest / numberOfInstallments;
      const outstandingForInstallment = amountPerInstallment - amountPaidForThisInstallment;

      scheduleData.push({
        id: i,
        installment_number: i,
        due_date: dueDate,
        principal_amount: Math.round(principalForInstallment * 100) / 100,
        interest_amount: Math.round(interestForInstallment * 100) / 100,
        total_amount: Math.round(amountPerInstallment * 100) / 100,
        outstanding_amount: Math.round(outstandingForInstallment * 100) / 100,
        status: status,
      });
    }

    const outstandingBalance = parseFloat(loan.outstanding_balance ?? loan.outstandingBalance ?? 0);
    const paymentProgress = principalAmount > 0 ? Math.round((totalPaid / principalAmount) * 100) : 0;

    return {
      loan: {
        id: loan.id,
        loanNumber: loan.loan_number ?? loan.loanNumber,
        principalAmount: principalAmount,
        interestRate: parseFloat(loan.interest_rate ?? loan.interestRate ?? loan.productInterestRate ?? 0),
        interestType: loan.interest_type ?? loan.interestType ?? loan.productInterestType ?? 'flat',
        totalInterest: totalInterest,
        totalAmount: totalAmount,
        outstandingBalance: outstandingBalance,
        status: loan.status,
        disbursementDate: loan.disbursement_date ?? loan.disbursementDate,
        maturityDate: loan.maturity_date ?? loan.maturityDate,
        paymentFrequency: paymentFrequency,
        termDays: termDays,
        productName: loan.productName,
        productDescription: loan.productDescription,
      },
      paymentProgress: paymentProgress,
      schedule: scheduleData,
      payments: payments.map(payment => ({
        id: payment.id,
        amount: parseFloat(payment.amount || '0'),
        paymentDate: payment.payment_date ?? payment.paymentDate,
        paymentMethod: payment.payment_method ?? payment.paymentMethod,
        referenceNumber: payment.reference_number ?? payment.referenceNumber,
        status: payment.status,
        notes: payment.notes,
      })),
    };
  }

  async getLoanDetails(userId: number, loanId: number) {
    const knex = this.knexService.instance;

    // Resolve user → customer relationship
    const userWithCustomer = await knex('users')
      .select('users.tenant_id', 'customers.id as customer_id')
      .leftJoin('customers', 'users.id', 'customers.user_id')
      .where({ 'users.id': userId })
      .first();

    if (!userWithCustomer) {
      throw new NotFoundException('User not found');
    }

    const mainCustomerId = userWithCustomer.customerId;
    
    if (!mainCustomerId) {
      throw new NotFoundException('Customer record not found for this user');
    }

    const tenantId = userWithCustomer.tenantId;

    // Get loan details with product information
    const loan = await knex('money_loan_loans')
      .select(
        'money_loan_loans.*',
        'money_loan_products.name as productName',
        'money_loan_products.interest_rate as productInterestRate',
        'money_loan_products.interest_type as productInterestType',
        'money_loan_products.description as productDescription',
        'money_loan_products.min_amount as productMinAmount',
        'money_loan_products.max_amount as productMaxAmount'
      )
      .leftJoin('money_loan_products', 'money_loan_loans.loan_product_id', 'money_loan_products.id')
      .where({
        'money_loan_loans.id': loanId,
        'money_loan_loans.customer_id': mainCustomerId,
        'money_loan_loans.tenant_id': tenantId,
      })
      .first();

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    console.log(`🔍 Found loan ${loanId} for customer ${mainCustomerId}`);

    // Get payment history
    const payments = await knex('money_loan_payments')
      .where({
        'loan_id': loanId,
        'tenant_id': tenantId,
      })
      .orderBy('payment_date', 'desc');

    console.log(`� Payment history query result: ${payments.length} records`);

    // Generate repayment schedule dynamically (same logic as MoneyLoanService)
    const paymentFrequency = loan.payment_frequency || loan.paymentFrequency || 'weekly';
    const termDays = loan.term_days || loan.termDays || 30;
    const disbursementDateValue = loan.disbursement_date || loan.disbursementDate;
    const disbursementDate = disbursementDateValue ? new Date(disbursementDateValue) : new Date();
    
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

    // Calculate total amount to be repaid (principal + interest)
    const principalAmount = parseFloat(loan.principal_amount || loan.principalAmount || '0');
    const totalInterest = parseFloat(loan.total_interest || loan.totalInterest || '0');
    const totalAmount = parseFloat(loan.total_amount || loan.totalAmount || '0') || (principalAmount + totalInterest);
    const amountPerInstallment = totalAmount / numberOfInstallments;

    console.log(`📅 Schedule calculation: ${numberOfInstallments} ${paymentFrequency} installments, ${amountPerInstallment} each`);

    // Calculate total paid from payments
    let totalPaid = 0;
    for (const payment of payments) {
      totalPaid += parseFloat(payment.amount || '0');
    }

    console.log(`💰 Total paid from ${payments.length} payments: ${totalPaid}`);

    // Generate installment schedule
    const scheduleData = [];
    for (let i = 1; i <= numberOfInstallments; i++) {
      const dueDate = new Date(disbursementDate);
      dueDate.setDate(dueDate.getDate() + (i * daysBetweenPayments));

      // Calculate how much of this installment has been paid
      const previousInstallmentsTotal = (i - 1) * amountPerInstallment;
      const thisInstallmentEnd = i * amountPerInstallment;
      
      let amountPaidForThisInstallment = 0;
      let status = 'pending';
      
      if (totalPaid >= thisInstallmentEnd) {
        amountPaidForThisInstallment = amountPerInstallment;
        status = 'paid';
      } else if (totalPaid > previousInstallmentsTotal) {
        amountPaidForThisInstallment = totalPaid - previousInstallmentsTotal;
        status = 'partial';
      }

      // Check if overdue
      const today = new Date();
      if (status !== 'paid' && dueDate < today) {
        status = 'overdue';
      }

      const principalForInstallment = principalAmount / numberOfInstallments;
      const interestForInstallment = totalInterest / numberOfInstallments;
      const outstandingForInstallment = amountPerInstallment - amountPaidForThisInstallment;

      scheduleData.push({
        id: i,
        installment_number: i,
        due_date: dueDate,
        principal_amount: Math.round(principalForInstallment * 100) / 100,
        interest_amount: Math.round(interestForInstallment * 100) / 100,
        total_amount: Math.round(amountPerInstallment * 100) / 100,
        outstanding_amount: Math.round(outstandingForInstallment * 100) / 100,
        status: status,
      });
    }

    const outstandingBalance = parseFloat(loan.outstanding_balance ?? loan.outstandingBalance ?? 0);
    const paymentProgress = principalAmount > 0 ? Math.round((totalPaid / principalAmount) * 100) : 0;

    console.log(`💰 Loan ${loanId} - Principal: ${principalAmount}, Total Paid: ${totalPaid}, Outstanding: ${outstandingBalance}, Progress: ${paymentProgress}%`);
    console.log(`📊 Schedule count: ${scheduleData.length}, Payments count: ${payments.length}`);

    return {
      id: loan.id,
      loanNumber: loan.loan_number ?? loan.loanNumber,
      status: loan.status,
      principalAmount,
      outstandingBalance,
      totalPaid,
      paymentProgress,
      interestRate: parseFloat(loan.interest_rate ?? loan.interestRate ?? 0),
      term: loan.term_months ?? loan.termMonths ?? 12,
      disbursementDate: loan.disbursement_date ?? loan.disbursementDate,
      maturityDate: loan.maturity_date ?? loan.maturityDate,
      nextPaymentDate: loan.next_payment_date ?? loan.nextPaymentDate,
      nextPaymentAmount: parseFloat(loan.next_payment_amount ?? loan.nextPaymentAmount ?? 0),
      productName: loan.productName,
      productInterestRate: parseFloat(loan.productInterestRate ?? 0),
      productInterestType: loan.productInterestType,
      productDescription: loan.productDescription,
      productMinAmount: parseFloat(loan.productMinAmount ?? 0),
      productMaxAmount: parseFloat(loan.productMaxAmount ?? 0),
      schedule: scheduleData.map(s => ({
        id: s.id,
        installmentNumber: s.installment_number ?? s.installmentNumber,
        dueDate: s.due_date ?? s.dueDate,
        principalAmount: parseFloat(s.principal_amount ?? s.principalAmount ?? 0),
        interestAmount: parseFloat(s.interest_amount ?? s.interestAmount ?? 0),
        totalAmount: parseFloat(s.total_amount ?? s.totalAmount ?? 0),
        outstandingAmount: parseFloat(s.outstanding_amount ?? s.outstandingAmount ?? 0),
        status: s.status,
      })),
      payments: payments.map(p => ({
        id: p.id,
        paymentDate: p.payment_date ?? p.paymentDate,
        amount: parseFloat(p.amount ?? 0),
        principalPaid: parseFloat(p.principal_paid ?? p.principalPaid ?? 0),
        interestPaid: parseFloat(p.interest_paid ?? p.interestPaid ?? 0),
        paymentMethod: p.payment_method ?? p.paymentMethod,
        referenceNumber: p.reference_number ?? p.referenceNumber,
        status: p.status,
      })),
    };
  }
}
