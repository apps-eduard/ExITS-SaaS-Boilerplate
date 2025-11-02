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

    const customer = await knex('customers')
      .select(
        'customers.*',
        'users.email as userEmail',
        'users.password_hash as passwordHash',
        'users.id as userId',
        'money_loan_customer_profiles.kyc_status as kycStatus',
        'money_loan_customer_profiles.credit_score as creditScore',
        'money_loan_customer_profiles.risk_level as riskLevel',
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

    if (!customer || !customer.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(loginDto.password, customer.passwordHash);
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
      userId: customer.userId,
      customerId: customer.id,
      tenantId: customer.tenantId,
      type: 'customer',
      permissions: customerPermissions,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: tokenExpiry });

    // Hash the token for storage
    const tokenHash = await bcrypt.hash(accessToken, 10);

    await knex('user_sessions').insert({
      user_id: customer.userId,
      token_hash: tokenHash,
      status: 'active',
      expires_at: new Date(Date.now() + (loginDto.rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000),
      user_agent: 'Customer Portal',
    });

    const customerData = { ...customer };
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
      },
    };
  }

  async getProfile(customerId: number, tenantId: number) {
    const knex = this.knexService.instance;

    const customer = await knex('customers')
      .select(
        'customers.*',
        'money_loan_customer_profiles.kyc_status as kycStatus',
        'money_loan_customer_profiles.credit_score as creditScore',
        'money_loan_customer_profiles.risk_level as riskLevel',
        'money_loan_customer_profiles.employment_status as employmentStatus',
        'money_loan_customer_profiles.monthly_income as monthlyIncome'
      )
      .leftJoin('money_loan_customer_profiles', 'customers.id', 'money_loan_customer_profiles.customer_id')
      .where({ 'customers.id': customerId, 'customers.tenant_id': tenantId })
      .first();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
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

  async getLoansById(customerId: number) {
    const knex = this.knexService.instance;

    // Get user's tenant_id (customerId is actually userId from the mobile app)
    const user = await knex('users')
      .select('tenant_id')
      .where({ id: customerId })
      .first();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    console.log(`🔍 getLoansById - Querying loans for customer_id=${customerId}, tenant_id=${user.tenantId}`);

    const loans = await knex('money_loan_loans')
      .select(
        'money_loan_loans.*',
        'money_loan_products.name as productName',
        'money_loan_products.interest_rate as productInterestRate'
      )
      .leftJoin('money_loan_products', 'money_loan_loans.loan_product_id', 'money_loan_products.id')
      .where({
        'money_loan_loans.customer_id': customerId,
        'money_loan_loans.tenant_id': user.tenantId,
      })
      .orderBy('money_loan_loans.created_at', 'desc');

    console.log(`📊 getLoansById - Found ${loans.length} loans`);
    
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

    let query = knex('money_loan_payments')
      .select('money_loan_payments.*', 'money_loan_loans.loan_number as loanNumber')
      .join('money_loan_loans', 'money_loan_payments.loan_id', 'money_loan_loans.id')
      .where({
        'money_loan_loans.customer_id': customerId,
        'money_loan_loans.tenant_id': tenantId,
      })
      .orderBy('money_loan_payments.created_at', 'desc');

    if (loanId) {
      query = query.where('money_loan_payments.loan_id', loanId);
    }

    return await query;
  }

  async getDashboard(customerId: number) {
    const knex = this.knexService.instance;

    // Get user info to find tenant_id (customerId is actually userId from the mobile app)
    const user = await knex('users')
      .select('users.*', 'users.tenant_id')
      .where({ 'users.id': customerId })
      .first();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tenantId = user.tenantId;

    console.log(`🔍 getDashboard - Querying for customer_id=${customerId}, tenant_id=${tenantId}`);

    // Get all loans for this user (money_loan_loans.customer_id refers to users.id)
    const loans = await knex('money_loan_loans')
      .where({
        'customer_id': customerId,
        'tenant_id': tenantId,
      });

    console.log(`📊 getDashboard - Found ${loans.length} loans for customer ${customerId}`);

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

    // Get next payment info
    const nextPayment = await knex('money_loan_repayment_schedules as schedule')
      .join('money_loan_loans as loans', 'schedule.loan_id', 'loans.id')
      .select(
        'schedule.due_date',
        'schedule.total_amount',
        'schedule.outstanding_amount'
      )
      .where('loans.customer_id', customerId)
      .andWhere('loans.tenant_id', tenantId)
      .andWhere(builder =>
        builder.whereIn('schedule.status', ['pending', 'partially_paid'])
      )
      .orderBy('schedule.due_date', 'asc')
      .first();

    // Get recent loans
    const recentLoans = await knex('money_loan_loans')
      .select(
        'money_loan_loans.*',
        'money_loan_products.name as productName'
      )
      .leftJoin('money_loan_products', 'money_loan_loans.loan_product_id', 'money_loan_products.id')
      .where({
  'money_loan_loans.customer_id': customerId,
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
}
