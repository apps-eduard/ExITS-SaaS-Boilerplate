import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { KnexService } from '../database/knex.service';
import {
  CreateLoanApplicationDto,
  ApproveLoanDto,
  DisburseLoanDto,
  CreatePaymentDto,
  CreateLoanProductDto,
  UpdateLoanProductDto,
  LoanTermType,
} from './dto/money-loan.dto';

@Injectable()
export class MoneyLoanService {
  constructor(private knexService: KnexService) {}

  async createApplication(tenantId: number, createDto: CreateLoanApplicationDto) {
    const knex = this.knexService.instance;
    console.log('🔍 CREATE APPLICATION - DTO:', createDto);
    console.log('🔍 CREATE APPLICATION - Tenant ID:', tenantId);

    const appNumber = `APP-${tenantId}-${Date.now()}`;

    const appData: any = {};
    if (createDto.creditScore) appData.creditScore = createDto.creditScore;
    if (createDto.annualIncome) appData.annualIncome = createDto.annualIncome;
    if (createDto.employmentStatus) appData.employmentStatus = createDto.employmentStatus;
    if (createDto.collateralDescription) appData.collateralDescription = createDto.collateralDescription;

    const [application] = await knex('money_loan_applications')
      .insert({
        tenant_id: tenantId,
        customer_id: createDto.customerId,
        loan_product_id: createDto.loanProductId,
        application_number: appNumber,
        requested_amount: createDto.requestedAmount,
        requested_term_days: createDto.requestedTermDays,
        purpose: createDto.purpose || 'Loan application',
        status: 'submitted',
        application_data: JSON.stringify(appData),
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
      .returning('*');

    console.log('📦 CREATE APPLICATION - Raw DB response:', application);

    // Fetch product details to include in response
    const productDetails = await knex('money_loan_products')
      .where({ id: createDto.loanProductId, tenant_id: tenantId })
      .first();

    console.log('🏷️ CREATE APPLICATION - Product details:', productDetails);

    const result = {
      ...application,
      product_code: productDetails?.product_code || null,
      product_name: productDetails?.name || null,
    };

    console.log('✅ CREATE APPLICATION - Final result:', result);

    return result;
  }

  async getApplications(
    tenantId: number,
    filters: {
      customerId?: number;
      status?: string;
      productId?: number;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const knex = this.knexService.instance;
    const {
      customerId,
      status,
      productId,
      search,
      page = 1,
      limit = 25,
    } = filters;

    const pageNumber = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const limitNumber = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 25;

    const baseQuery = knex('money_loan_applications as mla')
      .leftJoin('customers as c', 'mla.customer_id', 'c.id')
      .leftJoin('money_loan_products as mlp', 'mla.loan_product_id', 'mlp.id')
      .select(
        'mla.*',
        'c.first_name as customer_first_name',
        'c.last_name as customer_last_name',
        'c.email as customer_email',
        'mlp.name as product_name',
        'mlp.product_code as product_code',
        'mlp.min_amount as product_min_amount',
        'mlp.max_amount as product_max_amount',
        'mlp.processing_fee_percent as product_processing_fee_percent',
        'mlp.platform_fee as product_platform_fee',
        'mlp.payment_frequency as product_payment_frequency',
        'mlp.interest_rate as product_interest_rate',
        'mlp.interest_type as product_interest_type',
        'mlp.loan_term_type as product_loan_term_type',
        'mlp.fixed_term_days as product_fixed_term_days'
      )
      .where('mla.tenant_id', tenantId);

    if (customerId) {
      baseQuery.where('mla.customer_id', customerId);
    }

    if (status) {
      baseQuery.where('mla.status', status);
    }

    if (productId) {
      baseQuery.where('mla.loan_product_id', productId);
    }

    if (search) {
      const likeQuery = `%${search}%`;
      baseQuery.where((builder) => {
        builder
          .whereILike('mla.application_number', likeQuery)
          .orWhereILike('mla.purpose', likeQuery)
          .orWhereILike('c.first_name', likeQuery)
          .orWhereILike('c.last_name', likeQuery)
          .orWhereILike('mlp.name', likeQuery);
      });
    }

    const totalResult = await baseQuery
      .clone()
      .clearSelect()
      .count<{ count: string }[]>({ count: '*' });

    const total = Number(totalResult?.[0]?.count ?? 0);
    const offset = (pageNumber - 1) * limitNumber;

    const rows = await baseQuery
      .clone()
      .orderBy('mla.created_at', 'desc')
      .offset(offset)
      .limit(limitNumber);

    console.log('📋 GET APPLICATIONS - Raw rows from DB:', JSON.stringify(rows, null, 2));

    const data = rows.map((row: any) => this.mapApplicationRow(row));

    console.log('📋 GET APPLICATIONS - Mapped data:', JSON.stringify(data, null, 2));

    return {
      data,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: total > 0 ? Math.ceil(total / limitNumber) : 0,
      },
    };
  }

  async approveApplication(tenantId: number, applicationId: number, approveDto: ApproveLoanDto, approvedBy: number) {
    const knex = this.knexService.instance;

    const application = await knex('money_loan_applications')
      .where({ id: applicationId, tenant_id: tenantId })
      .first();

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    await knex('money_loan_applications')
      .where({ id: applicationId })
      .update({
        status: 'approved',
        approved_amount: approveDto.approvedAmount,
        approved_term_days: approveDto.approvedTermDays,
        approved_interest_rate: approveDto.interestRate,
        reviewed_at: knex.fn.now(),
        reviewed_by: approvedBy,
        review_notes: approveDto.notes,
        updated_at: knex.fn.now(),
      });

    const loanNumber = `LOAN-${tenantId}-${Date.now()}`;

    // Use pre-calculated values from frontend
    const [loan] = await knex('money_loan_loans')
      .insert({
        tenant_id: tenantId,
        customer_id: application.customerId,
        loan_product_id: application.loanProductId,
        application_id: applicationId,
        loan_number: loanNumber,
        principal_amount: approveDto.approvedAmount,
        interest_rate: approveDto.interestRate,
        interest_type: approveDto.interestType,
        term_days: approveDto.approvedTermDays,
        processing_fee: approveDto.processingFee,
        total_interest: approveDto.totalInterest,
        total_amount: approveDto.totalAmount,
        outstanding_balance: approveDto.totalAmount, // Starts at total amount
        status: 'pending',
      })
      .returning('*');

    return loan;
  }

  async rejectApplication(
    tenantId: number,
    applicationId: number,
    rejectDto: { notes: string },
    rejectedBy: number,
  ) {
    const knex = this.knexService.instance;

    const application = await knex('money_loan_applications')
      .where({ id: applicationId, tenant_id: tenantId })
      .first();

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status === 'approved' || application.status === 'rejected') {
      throw new BadRequestException(`Application is already ${application.status}`);
    }

    await knex('money_loan_applications')
      .where({ id: applicationId })
      .update({
        status: 'rejected',
        review_notes: rejectDto.notes,
        reviewed_at: knex.fn.now(),
        reviewed_by: rejectedBy,
        updated_at: knex.fn.now(),
      });

    return await knex('money_loan_applications')
      .where({ id: applicationId })
      .first();
  }

  async getLoans(
    tenantId: number,
    filters: {
      customerId?: number;
      status?: string;
      loanProductId?: number;
      productId?: number;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const knex = this.knexService.instance;
    const {
      customerId,
      status,
      loanProductId,
      productId,
      search,
      page = 1,
      limit = 20,
    } = filters;

    console.log('🔎 [GET LOANS SERVICE] Starting query with filters:', {
      tenantId,
      customerId,
      status,
      loanProductId,
      productId,
      search,
      page,
      limit
    });

    const pageNumber = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const limitNumber = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 20;

    const baseQuery = knex('money_loan_loans as mll')
      .leftJoin('customers as c', 'mll.customer_id', 'c.id')
      .leftJoin('money_loan_products as mlp', 'mll.loan_product_id', 'mlp.id')
      .select(
        'mll.*',
        'c.first_name',
        'c.last_name',
        'c.email as customer_email',
        'mlp.name as product_name'
      )
      .where('mll.tenant_id', tenantId);

    if (customerId) {
      console.log('📌 Filtering by customerId:', customerId);
      baseQuery.where('mll.customer_id', customerId);
    }

    if (status) {
      // Support comma-separated status values like 'active,overdue'
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
      console.log('📌 Filtering by status:', statuses);
      if (statuses.length === 1) {
        baseQuery.where('mll.status', statuses[0]);
      } else if (statuses.length > 1) {
        baseQuery.whereIn('mll.status', statuses);
      }
    }

    const normalizedProductId = productId ?? loanProductId;
    if (normalizedProductId) {
      console.log('📌 Filtering by productId:', normalizedProductId);
      baseQuery.where('mll.loan_product_id', normalizedProductId);
    }

    if (search) {
      console.log('📌 Searching for:', search);
      const like = `%${search}%`;
      baseQuery.where((builder) => {
        builder
          .whereILike('mll.loan_number', like)
          .orWhereILike('c.first_name', like)
          .orWhereILike('c.last_name', like)
          .orWhereILike('mlp.name', like);
      });
    }

    const totalResult = await baseQuery
      .clone()
      .clearSelect()
      .count<{ count: string }[]>({ count: '*' });

    const total = Number(totalResult?.[0]?.count ?? 0);
    console.log('📊 Total matching loans:', total);
    
    const offset = (pageNumber - 1) * limitNumber;

    const rows = await baseQuery
      .clone()
      .orderBy('mll.created_at', 'desc')
      .offset(offset)
      .limit(limitNumber);

    console.log('📦 Retrieved loans:', rows.length);
    console.log('📝 SQL Query:', baseQuery.toString());

    const data = rows.map((row: any) => this.mapLoanRow(row));
    
    console.log('✅ [GET LOANS SERVICE] Returning:', data.length, 'loans');

    return {
      data,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: total > 0 ? Math.ceil(total / limitNumber) : 0,
      },
    };
  }

  async disburseLoan(tenantId: number, loanId: number, disburseDto: DisburseLoanDto, disbursedBy: number) {
    const knex = this.knexService.instance;

    const loan = await knex('money_loan_loans')
      .where({ id: loanId, tenant_id: tenantId })
      .first();

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    await knex('money_loan_loans')
      .where({ id: loanId })
      .update({
        status: 'active',
        disbursement_date: knex.fn.now(),
        disbursed_by: disbursedBy,
        disbursement_method: disburseDto.disbursementMethod,
        disbursement_reference: disburseDto.disbursementReference,
        disbursement_notes: disburseDto.disbursementNotes,
      });

    const [updatedRow] = await knex('money_loan_loans as mll')
      .leftJoin('customers as c', 'mll.customer_id', 'c.id')
      .leftJoin('money_loan_products as mlp', 'mll.loan_product_id', 'mlp.id')
      .select(
        'mll.*',
        'c.first_name',
        'c.last_name',
        'c.email as customer_email',
        'mlp.name as product_name'
      )
      .where('mll.id', loanId)
      .andWhere('mll.tenant_id', tenantId)
      .limit(1);

    if (!updatedRow) {
      throw new NotFoundException('Loan not found after disbursement');
    }

    return this.mapLoanRow(updatedRow);
  }

  private mapApplicationRow(row: any) {
    if (!row) {
      return null;
    }

    console.log('🔍 mapApplicationRow - Raw row keys:', Object.keys(row));
    console.log('🔍 mapApplicationRow - created_at value:', row.created_at);
    console.log('🔍 mapApplicationRow - createdAt value:', row.createdAt);

    const requestedAmount = row.requestedAmount ?? row.requested_amount ?? 0;
    const approvedAmount = row.approvedAmount ?? row.approved_amount ?? null;
    const requestedTermDays = row.requestedTermDays ?? row.requested_term_days ?? null;
    const approvedTermDays = row.approvedTermDays ?? row.approved_term_days ?? null;

    const applicationNumber = row.applicationNumber ?? row.application_number;
    const createdAt = row.createdAt ?? row.created_at ?? null;

    console.log('✅ mapApplicationRow - Final createdAt:', createdAt);

    const customerFirstName = row.customerFirstName ?? row.firstName ?? row.customer_first_name ?? row.first_name;
    const customerLastName = row.customerLastName ?? row.lastName ?? row.customer_last_name ?? row.last_name;

    return {
      // snake_case fields for existing Angular code
      id: row.id,
      application_number: applicationNumber,
      customer_id: row.customerId ?? row.customer_id,
      loan_product_id: row.loanProductId ?? row.loan_product_id,
      requested_amount: Number(requestedAmount) || 0,
      requested_term_days: requestedTermDays ?? 0,
      approved_amount: approvedAmount !== null ? Number(approvedAmount) : null,
      approved_term_days: approvedTermDays,
      purpose: row.purpose ?? null,
      status: row.status,
      created_at: createdAt,
      customer_email: row.customerEmail ?? row.customer_email ?? null,
      first_name: customerFirstName ?? null,
      last_name: customerLastName ?? null,
      product_name: row.productName ?? row.product_name ?? null,
      product_code: row.productCode ?? row.product_code ?? null,
      product_min_amount: row.productMinAmount ?? row.product_min_amount ?? null,
      product_max_amount: row.productMaxAmount ?? row.product_max_amount ?? null,
      product_platform_fee: row.productPlatformFee ?? row.product_platform_fee ?? null,
      product_processing_fee_percent: row.productProcessingFeePercent ?? row.product_processing_fee_percent ?? null,
      product_payment_frequency: row.productPaymentFrequency ?? row.product_payment_frequency ?? null,
      reviewer_first_name: row.reviewerFirstName ?? row.reviewer_first_name ?? null,
      reviewer_last_name: row.reviewerLastName ?? row.reviewer_last_name ?? null,
      reviewer_email: row.reviewerEmail ?? row.reviewer_email ?? null,
      // camelCase duplicates for future use
      applicationNumber,
      customerId: row.customerId ?? row.customer_id,
      loanProductId: row.loanProductId ?? row.loan_product_id,
      requestedAmount: Number(requestedAmount) || 0,
      requestedTermDays,
      approvedAmount: approvedAmount !== null ? Number(approvedAmount) : null,
      approvedTermDays,
      customerEmail: row.customerEmail ?? row.customer_email ?? null,
      firstName: customerFirstName ?? null,
      lastName: customerLastName ?? null,
      productName: row.productName ?? row.product_name ?? null,
      createdAt,
    };
  }

  private mapLoanRow(row: any) {
    if (!row) {
      return null;
    }

  const termDays = row.termDays ?? row.approvedTermDays ?? row.requestedTermDays ?? null;
  const loanTermMonths = termDays ? Math.max(1, Math.round(termDays / 30)) : 0;

    return {
      ...row,
      loanTermMonths,
      customer: {
        fullName: [row.firstName, row.lastName].filter(Boolean).join(' ') || 'N/A',
        customerCode: row.customerId ? `CUST-${row.customerId}` : undefined,
        email: row.customerEmail ?? undefined,
      },
    };
  }

  async createPayment(tenantId: number, createPaymentDto: CreatePaymentDto, createdBy: number) {
    const knex = this.knexService.instance;

    const loan = await knex('money_loan_loans')
      .where({ id: createPaymentDto.loanId, tenant_id: tenantId })
      .first();

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    return await knex.transaction(async (trx) => {
      // Calculate principal and interest breakdown (simplified for now)
      const principalAmount = createPaymentDto.amount; // For now, treat full amount as principal
      const interestAmount = 0; // Will be enhanced later with proper allocation logic
      
      const [payment] = await trx('money_loan_payments')
        .insert({
          tenant_id: tenantId,
          loan_id: createPaymentDto.loanId,
          customer_id: loan.customerId,
          amount: createPaymentDto.amount,
          principal_amount: principalAmount,
          interest_amount: interestAmount,
          penalty_amount: 0,
          payment_method: createPaymentDto.paymentMethod,
          payment_reference: createPaymentDto.reference,
          payment_date: knex.fn.now(),
          notes: createPaymentDto.notes,
          status: 'completed',
          received_by: createdBy,
        })
        .returning('*');

      const newBalance = Number(loan.outstandingBalance || loan.principalAmount) - createPaymentDto.amount;

      await trx('money_loan_loans')
        .where({ id: createPaymentDto.loanId })
        .update({
          outstanding_balance: newBalance,
          status: newBalance <= 0 ? 'paid_off' : loan.status,
        });

      return payment;
    });
  }

  async getPayments(tenantId: number, loanId: number) {
    const knex = this.knexService.instance;

    return await knex('money_loan_payments')
      .where({ tenant_id: tenantId, loan_id: loanId })
      .orderBy('created_at', 'desc');
  }

  async generateRepaymentSchedule(tenantId: number, loanId: number) {
    const knex = this.knexService.instance;

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

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    console.log('🔍 Loan data:', {
      id: loan.id,
      principal_amount: loan.principal_amount,
      total_interest: loan.total_interest,
      interest_amount: loan.interest_amount,
      total_amount: loan.total_amount,
      outstanding_balance: loan.outstanding_balance,
      status: loan.status,
      disbursement_date: loan.disbursement_date,
      // camelCase versions
      principalAmount: loan.principalAmount,
      totalInterest: loan.totalInterest,
      totalAmount: loan.totalAmount,
      outstandingBalance: loan.outstandingBalance,
      disbursementDate: loan.disbursementDate,
      all_keys: Object.keys(loan)
    });

    // Get all payments for this loan
    const payments = await knex('money_loan_payments')
      .where({ tenant_id: tenantId, loan_id: loanId })
      .orderBy('payment_date', 'asc');

    // Determine payment frequency (daily, weekly, monthly)
    const paymentFrequency = loan.payment_frequency || loan.paymentFrequency || loan.product_payment_frequency || loan.productPaymentFrequency || 'weekly';
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
    // Try both snake_case and camelCase field names
    const principalAmount = parseFloat(loan.principal_amount || loan.principalAmount) || 0;
    const totalInterest = parseFloat(loan.total_interest || loan.totalInterest) || 0;
    const totalAmount = parseFloat(loan.total_amount || loan.totalAmount) || (principalAmount + totalInterest);
    const amountPerInstallment = totalAmount / numberOfInstallments;

    console.log('📊 Repayment Schedule Calculation:', {
      loanId,
      paymentFrequency,
      termDays,
      numberOfInstallments,
      principalAmount,
      totalInterest,
      totalAmount,
      amountPerInstallment,
      paymentsCount: payments.length
    });

    // Generate installment schedule
    const schedule = [];
    let totalPaid = 0;
    
    // Calculate total paid from payments
    for (const payment of payments) {
      totalPaid += parseFloat(payment.amount) || 0;
    }

    console.log('💰 Total Paid So Far:', totalPaid);

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

      console.log(`📅 Installment ${i}: totalDue=${amountPerInstallment.toFixed(2)}, paid=${amountPaidForThisInstallment.toFixed(2)}, status=${status}`);

      schedule.push({
        id: i, // Using installment number as ID since we don't have a separate table
        installmentNumber: i,
        installment_number: i,
        dueDate: dueDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        principalDue: amountPerInstallment * (principalAmount / totalAmount),
        principal_due: amountPerInstallment * (principalAmount / totalAmount),
        interestDue: amountPerInstallment * (totalInterest / totalAmount),
        interest_due: amountPerInstallment * (totalInterest / totalAmount),
        totalDue: amountPerInstallment,
        total_due: amountPerInstallment,
        amountPaid: amountPaidForThisInstallment,
        amount_paid: amountPaidForThisInstallment,
        status
      });
    }

    return schedule;
  }

  async getProducts(tenantId: number, options: { onlyActive?: boolean } = {}) {
    const knex = this.knexService.instance;

    const query = knex('money_loan_products')
      .where({ tenant_id: tenantId })
      .orderBy('name', 'asc');

    if (options.onlyActive) {
      query.andWhere('is_active', true);
    }

    return await query;
  }

  async getProductById(tenantId: number, productId: number) {
    const knex = this.knexService.instance;

    const product = await knex('money_loan_products')
      .where({ tenant_id: tenantId, id: productId })
      .first();

    if (!product) {
      throw new NotFoundException('Loan product not found');
    }

    return product;
  }

  async createProduct(tenantId: number, dto: CreateLoanProductDto) {
    const knex = this.knexService.instance;
    const loanTermType = dto.loanTermType ?? LoanTermType.FLEXIBLE;

    if (dto.minAmount !== undefined && dto.maxAmount !== undefined && dto.minAmount > dto.maxAmount) {
      throw new BadRequestException('Minimum amount cannot be greater than maximum amount');
    }

    if (loanTermType === LoanTermType.FIXED) {
      if (!dto.fixedTermDays || dto.fixedTermDays <= 0) {
        throw new BadRequestException('fixedTermDays is required for fixed term products');
      }
    } else {
      if (dto.minTermDays === undefined || dto.maxTermDays === undefined) {
        throw new BadRequestException('minTermDays and maxTermDays are required for flexible products');
      }
      if (dto.minTermDays > dto.maxTermDays) {
        throw new BadRequestException('minTermDays cannot be greater than maxTermDays');
      }
    }

    const insertPayload: Record<string, any> = {
      tenant_id: tenantId,
      product_code: dto.productCode,
      name: dto.name,
      description: dto.description ?? null,
      min_amount: dto.minAmount,
      max_amount: dto.maxAmount,
      interest_rate: dto.interestRate,
      interest_type: dto.interestType ?? 'reducing',
      loan_term_type: loanTermType,
      fixed_term_days: loanTermType === LoanTermType.FIXED ? dto.fixedTermDays ?? null : null,
      min_term_days: loanTermType === LoanTermType.FLEXIBLE ? dto.minTermDays ?? null : null,
      max_term_days: loanTermType === LoanTermType.FLEXIBLE ? dto.maxTermDays ?? null : null,
      processing_fee_percent: dto.processingFeePercent ?? 0,
      platform_fee: dto.platformFee ?? 0,
      late_payment_penalty_percent: dto.latePaymentPenaltyPercent ?? 0,
      grace_period_days: dto.gracePeriodDays ?? 0,
      payment_frequency: dto.paymentFrequency ?? 'weekly',
      is_active: dto.isActive ?? true,
    };

    this.sanitizePayload(insertPayload);

    try {
      const [result] = await knex('money_loan_products')
        .insert(insertPayload)
        .returning('id');

      const createdId = typeof result === 'object' ? result.id : result;
      return await this.getProductById(tenantId, Number(createdId));
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException('Product code already exists for this tenant');
      }
      throw error;
    }
  }

  async updateProduct(tenantId: number, productId: number, dto: UpdateLoanProductDto) {
    const knex = this.knexService.instance;
    const existing = await this.getProductById(tenantId, productId);

    const existingMinAmount = Number(existing.minAmount ?? existing.min_amount ?? 0);
    const existingMaxAmount = Number(existing.maxAmount ?? existing.max_amount ?? 0);
    const minAmount = dto.minAmount ?? existingMinAmount;
    const maxAmount = dto.maxAmount ?? existingMaxAmount;

    if (minAmount > maxAmount) {
      throw new BadRequestException('Minimum amount cannot be greater than maximum amount');
    }

    const existingLoanTermType = existing.loanTermType ?? existing.loan_term_type ?? LoanTermType.FLEXIBLE;
    const targetLoanTermType = dto.loanTermType ?? existingLoanTermType;

    if (targetLoanTermType === LoanTermType.FIXED) {
      const fixedTermDays = dto.fixedTermDays ?? existing.fixedTermDays ?? existing.fixed_term_days;
      if (!fixedTermDays || fixedTermDays <= 0) {
        throw new BadRequestException('fixedTermDays is required for fixed term products');
      }
    } else {
      const minTermDays = dto.minTermDays ?? existing.minTermDays ?? existing.min_term_days;
      const maxTermDays = dto.maxTermDays ?? existing.maxTermDays ?? existing.max_term_days;
      if (minTermDays !== undefined && maxTermDays !== undefined && minTermDays !== null && maxTermDays !== null) {
        if (minTermDays > maxTermDays) {
          throw new BadRequestException('minTermDays cannot be greater than maxTermDays');
        }
      }
    }

    if (targetLoanTermType === LoanTermType.FLEXIBLE && existingLoanTermType === LoanTermType.FIXED) {
      if (dto.minTermDays === undefined || dto.maxTermDays === undefined) {
        throw new BadRequestException('minTermDays and maxTermDays are required when switching to flexible products');
      }
    }

    const updates: Record<string, any> = {
      updated_at: knex.fn.now(),
    };

    if (dto.productCode !== undefined) {
      updates.product_code = dto.productCode;
    }
    if (dto.name !== undefined) {
      updates.name = dto.name;
    }
    if (dto.description !== undefined) {
      updates.description = dto.description ?? null;
    }
    if (dto.minAmount !== undefined) {
      updates.min_amount = dto.minAmount;
    }
    if (dto.maxAmount !== undefined) {
      updates.max_amount = dto.maxAmount;
    }
    if (dto.interestRate !== undefined) {
      updates.interest_rate = dto.interestRate;
    }
    if (dto.interestType !== undefined) {
      updates.interest_type = dto.interestType;
    }
    if (dto.processingFeePercent !== undefined) {
      updates.processing_fee_percent = dto.processingFeePercent;
    }
    if (dto.platformFee !== undefined) {
      updates.platform_fee = dto.platformFee;
    }
    if (dto.latePaymentPenaltyPercent !== undefined) {
      updates.late_payment_penalty_percent = dto.latePaymentPenaltyPercent;
    }
    if (dto.gracePeriodDays !== undefined) {
      updates.grace_period_days = dto.gracePeriodDays;
    }
    if (dto.paymentFrequency !== undefined) {
      updates.payment_frequency = dto.paymentFrequency;
    }
    if (dto.isActive !== undefined) {
      updates.is_active = dto.isActive;
    }
    if (dto.loanTermType !== undefined) {
      updates.loan_term_type = dto.loanTermType;
    }

    if (targetLoanTermType === LoanTermType.FIXED) {
      updates.fixed_term_days = dto.fixedTermDays ?? existing.fixedTermDays ?? existing.fixed_term_days;
      updates.min_term_days = null;
      updates.max_term_days = null;
    } else {
      updates.fixed_term_days = null;

      if (dto.minTermDays !== undefined || existingLoanTermType === LoanTermType.FIXED) {
        updates.min_term_days = dto.minTermDays ?? existing.minTermDays ?? existing.min_term_days ?? null;
      }

      if (dto.maxTermDays !== undefined || existingLoanTermType === LoanTermType.FIXED) {
        updates.max_term_days = dto.maxTermDays ?? existing.maxTermDays ?? existing.max_term_days ?? null;
      }

      if (updates.loan_term_type === undefined && existingLoanTermType === LoanTermType.FIXED && targetLoanTermType === LoanTermType.FLEXIBLE) {
        updates.loan_term_type = LoanTermType.FLEXIBLE;
      }
    }

    this.sanitizePayload(updates);

    if (Object.keys(updates).length === 0) {
      return existing;
    }

    try {
      await knex('money_loan_products')
        .where({ tenant_id: tenantId, id: productId })
        .update(updates);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException('Product code already exists for this tenant');
      }
      throw error;
    }

    return await this.getProductById(tenantId, productId);
  }

  async deleteProduct(tenantId: number, productId: number) {
    const knex = this.knexService.instance;

    const deleted = await knex('money_loan_products')
      .where({ tenant_id: tenantId, id: productId })
      .delete();

    if (!deleted) {
      throw new NotFoundException('Loan product not found');
    }
  }

  private sanitizePayload(payload: Record<string, any>) {
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });
  }

  async getOverview(tenantId: number) {
    const knex = this.knexService.instance;

    const [stats] = await knex('money_loan_loans')
      .where('tenant_id', tenantId)
      .select(
        knex.raw('COUNT(*) as total_loans'),
        knex.raw('SUM(CASE WHEN status = \'active\' THEN 1 ELSE 0 END) as active_loans'),
        knex.raw('SUM(CASE WHEN status = \'overdue\' THEN 1 ELSE 0 END) as overdue_loans'),
        knex.raw('SUM(principal_amount) as total_disbursed'),
        knex.raw('SUM(COALESCE(outstanding_balance, principal_amount)) as total_outstanding'),
      );

    return stats;
  }

  async getCustomers(tenantId: number, filters: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    kycStatus?: string;
  }) {
    const knex = this.knexService.instance;
    const { page, limit, search, status, kycStatus } = filters;
    const offset = (page - 1) * limit;

    let query = knex('customers as c')
      .leftJoin('money_loan_customer_profiles as mlcp', 'c.id', 'mlcp.customer_id')
      .select(
        'c.id',
        'c.customer_code as customerCode',
        'c.first_name as firstName',
        'c.last_name as lastName',
        'c.email',
        'c.phone',
        'c.status',
        'mlcp.kyc_status as kycStatus',
        'mlcp.credit_score as creditScore',
        'mlcp.risk_level as riskLevel',
        knex.raw('(SELECT COUNT(*) FROM money_loan_loans WHERE customer_id = c.id AND status = \'active\') as active_loans')
      )
      .where('c.tenant_id', tenantId);

    if (search) {
      query = query.where(function() {
        this.where('c.first_name', 'ilike', `%${search}%`)
          .orWhere('c.last_name', 'ilike', `%${search}%`)
          .orWhere('c.email', 'ilike', `%${search}%`)
          .orWhere('c.phone', 'ilike', `%${search}%`)
          .orWhere('c.customer_code', 'ilike', `%${search}%`);
      });
    }

    if (status) {
      query = query.where('c.status', status);
    }

    if (kycStatus) {
      query = query.where('mlcp.kyc_status', kycStatus);
    }

    const [{ count }] = await knex('customers as c')
      .leftJoin('money_loan_customer_profiles as mlcp', 'c.id', 'mlcp.customer_id')
      .where('c.tenant_id', tenantId)
      .modify((qb) => {
        if (search) {
          qb.where(function() {
            this.where('c.first_name', 'ilike', `%${search}%`)
              .orWhere('c.last_name', 'ilike', `%${search}%`)
              .orWhere('c.email', 'ilike', `%${search}%`)
              .orWhere('c.phone', 'ilike', `%${search}%`)
              .orWhere('c.customer_code', 'ilike', `%${search}%`);
          });
        }
        if (status) {
          qb.where('c.status', status);
        }
        if (kycStatus) {
          qb.where('mlcp.kyc_status', kycStatus);
        }
      })
      .count('c.id');

    const data = await query
      .orderBy('c.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data,
      pagination: {
        page,
        limit,
        total: parseInt(count as string),
        pages: Math.ceil(parseInt(count as string) / limit),
      },
    };
  }

  async getCustomerById(tenantId: number, customerId: number) {
    const knex = this.knexService.instance;

    const customer = await knex('customers as c')
      .leftJoin('money_loan_customer_profiles as mlcp', 'c.id', 'mlcp.customer_id')
      .select(
        'c.*',
        'mlcp.kyc_status as kycStatus',
        'mlcp.credit_score as creditScore',
        'mlcp.risk_level as riskLevel',
        'mlcp.employment_status as employmentStatus',
        'mlcp.monthly_income as monthlyIncome'
      )
      .where({ 'c.id': customerId, 'c.tenant_id': tenantId })
      .first();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async createCustomer(tenantId: number, customerData: any, createdBy: number) {
    const knex = this.knexService.instance;

    return await knex.transaction(async (trx) => {
      // Create customer
      const [customer] = await trx('customers')
        .insert({
          tenant_id: tenantId,
          customer_code: customerData.customerCode || `CUST-${Date.now()}`,
          first_name: customerData.firstName,
          last_name: customerData.lastName,
          email: customerData.email,
          phone: customerData.phone,
          date_of_birth: customerData.dateOfBirth,
          gender: customerData.gender,
          status: customerData.status || 'active',
        })
        .returning('*');

      // Create money loan customer profile
      await trx('money_loan_customer_profiles').insert({
        customer_id: customer.id,
        kyc_status: customerData.kycStatus || 'pending',
        credit_score: customerData.creditScore || null,
        risk_level: customerData.riskLevel || 'medium',
        employment_status: customerData.employmentStatus || null,
        monthly_income: customerData.monthlyIncome || null,
      });

      return customer;
    });
  }

  async updateCustomer(tenantId: number, customerId: number, updateData: any) {
    const knex = this.knexService.instance;

    const customer = await knex('customers')
      .where({ id: customerId, tenant_id: tenantId })
      .first();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return await knex.transaction(async (trx) => {
      // Update customer
      await trx('customers')
        .where({ id: customerId })
        .update({
          first_name: updateData.firstName,
          last_name: updateData.lastName,
          email: updateData.email,
          phone: updateData.phone,
          date_of_birth: updateData.dateOfBirth,
          gender: updateData.gender,
          status: updateData.status,
          updated_at: knex.fn.now(),
        });

      // Update money loan profile
      await trx('money_loan_customer_profiles')
        .where({ customer_id: customerId })
        .update({
          kyc_status: updateData.kycStatus,
          credit_score: updateData.creditScore,
          risk_level: updateData.riskLevel,
          employment_status: updateData.employmentStatus,
          monthly_income: updateData.monthlyIncome,
        });

      return this.getCustomerById(tenantId, customerId);
    });
  }

  async getCustomerStats(tenantId: number, customerId: number) {
    const knex = this.knexService.instance;

    const [stats] = await knex('money_loan_loans')
      .where({ tenant_id: tenantId, customer_id: customerId })
      .select(
        knex.raw('COUNT(*) as total_loans'),
        knex.raw('SUM(CASE WHEN status = \'active\' THEN 1 ELSE 0 END) as active_loans'),
        knex.raw('SUM(principal_amount) as total_borrowed'),
        knex.raw('SUM(COALESCE(outstanding_balance, principal_amount)) as total_outstanding'),
      );

    return stats;
  }
}
