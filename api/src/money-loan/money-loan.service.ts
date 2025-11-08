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
  LoanCalculationRequestDto,
  PenaltyCalculationRequestDto,
} from './dto/money-loan.dto';

@Injectable()
export class MoneyLoanService {
  constructor(private knexService: KnexService) {
    // Clean implementation - no more manual fixes needed
  }

  async calculateLoanPreview(tenantId: number, payload: LoanCalculationRequestDto) {
    const {
      loanAmount,
      termMonths,
      paymentFrequency,
      interestRate,
      interestType,
      processingFeePercentage = 0,
      platformFee = 0,
      latePenaltyPercentage = 0,
      disbursementDate,
      deductPlatformFeeInAdvance = true,
      deductProcessingFeeInAdvance = true,
      deductInterestInAdvance = false,
    } = payload;

    if (!loanAmount || loanAmount <= 0) {
      throw new BadRequestException('Loan amount must be greater than zero');
    }

    if (!termMonths || termMonths <= 0) {
      throw new BadRequestException('Term must be at least one month');
    }

    const { LoanCalculatorService } = require('./loan-calculator.service');
    const calculator = new LoanCalculatorService();

    const calculation = calculator.calculate({
      loanAmount,
      termMonths,
      paymentFrequency,
      interestRate,
      interestType,
      processingFeePercentage,
      platformFee,
      latePenaltyPercentage,
      deductPlatformFeeInAdvance,
      deductProcessingFeeInAdvance,
      deductInterestInAdvance,
    });

    const scheduleStart = disbursementDate ? new Date(disbursementDate) : new Date();
    const schedule = calculator.generateSchedule(calculation, scheduleStart);

    const round = (value: number) => Math.round((value ?? 0) * 100) / 100;

    const normalizedCalculation = {
      ...calculation,
      interestAmount: round(calculation.interestAmount),
      processingFeeAmount: round(calculation.processingFeeAmount),
      platformFee: round(calculation.platformFee),
      netProceeds: round(calculation.netProceeds),
      totalRepayable: round(calculation.totalRepayable),
      installmentAmount: round(calculation.installmentAmount),
      totalDeductions: round(calculation.totalDeductions),
      monthlyEquivalent: calculation.monthlyEquivalent !== undefined
        ? round(calculation.monthlyEquivalent)
        : undefined,
      latePenaltyPercentage: calculation.latePenaltyPercentage,
      penaltyPerDay: calculation.penaltyPerDay !== undefined
        ? round(calculation.penaltyPerDay)
        : undefined,
    };

    const schedulePreview = schedule.map(item => ({
      paymentNumber: item.paymentNumber,
      dueDate: item.dueDate,
      installmentAmount: round(item.installmentAmount),
      principal: round(item.principal),
      interest: round(item.interest),
      remainingBalance: round(item.remainingBalance),
      cumulativePaid: round(item.cumulativePaid),
    }));

    console.log('🧮 Loan preview requested:', {
      tenantId,
      loanAmount,
      termMonths,
      paymentFrequency,
      interestRate,
      interestType,
      processingFeePercentage,
      platformFee,
    });

    return {
      calculation: normalizedCalculation,
      schedule: schedulePreview,
    };
  }

  async calculateLatePaymentPenalty(tenantId: number, payload: PenaltyCalculationRequestDto) {
    void tenantId; // tenant-based rules can be layered later
    const {
      installmentAmount,
      paymentFrequency,
      latePenaltyPercentage,
    } = payload;

    if (installmentAmount === undefined || installmentAmount < 0) {
      throw new BadRequestException('installmentAmount must be zero or greater');
    }

    const dueDate = new Date(payload.dueDate);
    if (Number.isNaN(dueDate.getTime())) {
      throw new BadRequestException('Invalid dueDate');
    }

    const paymentDate = payload.paymentDate ? new Date(payload.paymentDate) : new Date();
    if (Number.isNaN(paymentDate.getTime())) {
      throw new BadRequestException('Invalid paymentDate');
    }

    if (latePenaltyPercentage === undefined || latePenaltyPercentage < 0) {
      throw new BadRequestException('latePenaltyPercentage must be zero or greater');
    }

    const { LoanCalculatorService } = require('./loan-calculator.service');
    const calculator = new LoanCalculatorService();

    const result = calculator.calculatePenalty(
      Number(installmentAmount),
      dueDate,
      paymentDate,
      paymentFrequency,
      Number(latePenaltyPercentage),
    );

    const round = (value: number) => Math.round((value ?? 0) * 100) / 100;

    return {
      ...result,
      installmentAmount: round(result.installmentAmount),
      penaltyRate: Number(latePenaltyPercentage),
      latePenaltyPercentage: Number(latePenaltyPercentage),
      penaltyAmount: round(result.penaltyAmount),
      totalDue: round(result.totalDue),
    };
  }

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
      // Support comma-separated statuses
      const statuses = status.split(',').map(s => s.trim()).filter(s => s);
      console.log('🔍 [getApplications] Status filter - raw:', status, 'parsed:', statuses);
      if (statuses.length === 1) {
        baseQuery.where('mla.status', statuses[0]);
      } else if (statuses.length > 1) {
        baseQuery.whereIn('mla.status', statuses);
      }
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

    try {
      const application = await knex('money_loan_applications')
        .where({ id: applicationId, tenant_id: tenantId })
        .first();

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      console.log('📋 Application found:', application);

      // Get the product to retrieve all necessary details
      const product = await knex('money_loan_products')
        .where({ id: application.loanProductId })
        .first();

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      console.log('🏷️ Product found:', product);

    // Use the centralized loan calculator - SINGLE SOURCE OF TRUTH
    const { LoanCalculatorService } = require('./loan-calculator.service');
    const calculator = new LoanCalculatorService();

    const termMonths = approveDto.approvedTermDays / 30;
    const paymentFrequency = approveDto.paymentFrequency || product.paymentFrequency || 'weekly';
    
    const calculation = calculator.calculate({
      loanAmount: approveDto.approvedAmount,
      termMonths,
      paymentFrequency: paymentFrequency as 'daily' | 'weekly' | 'biweekly' | 'monthly',
      interestRate: approveDto.interestRate,
      interestType: approveDto.interestType as 'flat' | 'reducing' | 'compound',
      processingFeePercentage: product.processingFeePercent || 0,
      platformFee: product.platformFee || 0,
    });

    console.log('📊 Loan calculation:', calculation);

    // Update application status to approved
    // NOTE: We don't create a loan record here - that happens during disbursement
    const [updatedApplication] = await knex('money_loan_applications')
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
      })
      .returning('*');

    console.log('✅ Application approved:', updatedApplication);

      return updatedApplication;
    } catch (error) {
      console.error('❌ Error approving application:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
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
      .leftJoin('users as assigned_emp', 'c.assigned_employee_id', 'assigned_emp.id')
      .select(
        'mll.*',
        'c.first_name',
        'c.last_name',
        'c.email as customer_email',
        'c.assigned_employee_id',
        'mlp.name as product_name',
        knex.raw("CONCAT_WS(' ', assigned_emp.first_name, assigned_emp.last_name) as assigned_employee_name")
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

    const loanData = rows.map((row: any) => this.mapLoanRow(row));
    
    // ALSO fetch approved applications ready for disbursement if no status filter or status is 'pending'
    // This allows the disbursement page to show approved applications
    let applicationData: any[] = [];
    
    const shouldIncludeApplications = !status || status.includes('pending') || status.includes('approved');
    
    if (shouldIncludeApplications) {
      console.log('📋 Also fetching approved applications ready for disbursement');
      
      const applicationQuery = knex('money_loan_applications as mla')
        .leftJoin('customers as c', 'mla.customer_id', 'c.id')
        .leftJoin('money_loan_products as mlp', 'mla.loan_product_id', 'mlp.id')
        .leftJoin('users as assigned_emp', 'c.assigned_employee_id', 'assigned_emp.id')
        .select(
          'mla.*',
          'c.first_name',
          'c.last_name',
          'c.email as customer_email',
          'c.assigned_employee_id',
          'mlp.name as product_name',
          knex.raw("CONCAT_WS(' ', assigned_emp.first_name, assigned_emp.last_name) as assigned_employee_name")
        )
        .where('mla.tenant_id', tenantId)
        .where('mla.status', 'approved') // Only approved applications ready for disbursement
        .whereNotExists(function() {
          // Exclude applications that already have loans created
          this.select('id')
            .from('money_loan_loans')
            .whereRaw('money_loan_loans.application_id = mla.id');
        });
      
      if (customerId) {
        applicationQuery.where('mla.customer_id', customerId);
      }
      
      if (search) {
        const like = `%${search}%`;
        applicationQuery.where((builder) => {
          builder
            .whereILike('mla.application_number', like)
            .orWhereILike('c.first_name', like)
            .orWhereILike('c.last_name', like)
            .orWhereILike('mlp.name', like);
        });
      }
      
      const applicationRows = await applicationQuery;
      console.log('📋 Retrieved approved applications:', applicationRows.length);
      
      if (applicationRows.length > 0) {
        console.log('📄 [Applications → Loans] First approved application row:', applicationRows[0]);
      }

      // Map applications to look like loans (for disbursement page compatibility)
      applicationData = applicationRows.map((row: any) => ({
        id: row.id,
        loanNumber: `PENDING-${row.application_number ?? row.applicationNumber ?? row.id}`,
        applicationNumber: row.application_number ?? row.applicationNumber,
        customerId: row.customer_id ?? row.customerId,
        loanProductId: row.loan_product_id ?? row.loanProductId,
        principalAmount: row.approved_amount ?? row.approvedAmount ?? row.requested_amount ?? row.requestedAmount,
        outstandingBalance: row.approved_amount ?? row.approvedAmount ?? row.requested_amount ?? row.requestedAmount,
        status: 'pending', // Show as pending for disbursement
        createdAt: row.created_at ?? row.createdAt,
        disbursementDate: null,
        productName: row.product_name ?? row.productName,
        interestRate: row.productInterestRate ?? row.product_interest_rate ?? row.approvedInterestRate ?? row.approved_interest_rate,
        interestType: row.productInterestType ?? row.product_interest_type ?? 'flat',
        loanTermMonths: Math.round((row.approvedTermDays ?? row.approved_term_days ?? row.productFixedTermDays ?? row.product_fixed_term_days ?? 30) / 30),
        // Build customer object with proper field names from database
        customer: {
          fullName: `${row.firstName ?? row.first_name ?? ''} ${row.lastName ?? row.last_name ?? ''}`.trim(),
          customerCode: row.customerEmail ?? row.customer_email ?? row.email,
          email: row.customerEmail ?? row.customer_email ?? row.email,
          firstName: row.firstName ?? row.first_name ?? null,
          lastName: row.lastName ?? row.last_name ?? null,
          assignedEmployeeId: row.assignedEmployeeId ?? row.assigned_employee_id ?? null,
          assignedEmployeeName: row.assignedEmployeeName ?? row.assigned_employee_name ?? null,
        },
        // Also include at top level for collector column
        assignedEmployeeName: row.assignedEmployeeName ?? row.assigned_employee_name ?? null,
        assignedEmployeeId: row.assignedEmployeeId ?? row.assigned_employee_id ?? null,
        type: 'application', // Mark as application
        isApplication: true,
        applicationId: row.id
      }));
    }
    
    // ALSO fetch applications if customerId is provided and status filter includes application statuses
    if (customerId && status) {
      const applicationStatuses = status.split(',').map(s => s.trim()).filter(s => 
        ['submitted', 'approved', 'pending'].includes(s.toLowerCase())
      );
      
      if (applicationStatuses.length > 0) {
        console.log('📋 Also fetching applications with statuses:', applicationStatuses);
        
        const applicationQuery = knex('money_loan_applications as mla')
          .leftJoin('customers as c', 'mla.customer_id', 'c.id')
          .leftJoin('money_loan_products as mlp', 'mla.loan_product_id', 'mlp.id')
          .leftJoin('users as assigned_emp', 'c.assigned_employee_id', 'assigned_emp.id')
          .select(
            'mla.*',
            'c.first_name',
            'c.last_name',
            'c.email as customer_email',
            'c.assigned_employee_id',
            'mlp.name as product_name',
            knex.raw("CONCAT_WS(' ', assigned_emp.first_name, assigned_emp.last_name) as assigned_employee_name")
          )
          .where('mla.tenant_id', tenantId)
          .where('mla.customer_id', customerId)
          .whereIn('mla.status', applicationStatuses);
        
        const applicationRows = await applicationQuery;
        console.log('📋 Retrieved applications:', applicationRows.length);
        if (applicationRows.length > 0) {
          console.log('📄 [Applications → Loans] First filtered application row:', applicationRows[0]);
        }
        
        // Map applications to same format as loans
        applicationData = applicationRows.map((row: any) => ({
          id: row.id,
          loanNumber: null,
          applicationNumber: row.application_number ?? row.applicationNumber ?? `APP-${row.id}`,
          customerId: row.customer_id ?? row.customerId,
          loanProductId: row.loan_product_id ?? row.loanProductId,
          loan_product_id: row.loan_product_id,
          principalAmount: row.requested_amount ?? row.requestedAmount,
          amount: row.requested_amount ?? row.requestedAmount,
          requested_amount: row.requested_amount,
          requestedAmount: row.requested_amount ?? row.requestedAmount,
          status: row.status,
          createdAt: row.created_at ?? row.createdAt,
          created_at: row.created_at,
          productName: row.product_name ?? row.productName,
          interestRate: row.productInterestRate ?? row.product_interest_rate ?? row.approvedInterestRate ?? row.approved_interest_rate,
          interestType: row.productInterestType ?? row.product_interest_type ?? 'flat',
          loanTermMonths: Math.round((row.approvedTermDays ?? row.approved_term_days ?? row.productFixedTermDays ?? row.product_fixed_term_days ?? 30) / 30),
          // Add customer object for consistency
          customer: {
            fullName: `${row.firstName ?? row.first_name ?? ''} ${row.lastName ?? row.last_name ?? ''}`.trim(),
            customerCode: row.customerEmail ?? row.customer_email ?? row.email,
            email: row.customerEmail ?? row.customer_email ?? row.email,
            firstName: row.firstName ?? row.first_name ?? null,
            lastName: row.lastName ?? row.last_name ?? null,
            assignedEmployeeId: row.assignedEmployeeId ?? row.assigned_employee_id ?? null,
            assignedEmployeeName: row.assignedEmployeeName ?? row.assigned_employee_name ?? null,
          },
          // Legacy fields for backward compatibility
          customerFirstName: row.firstName ?? row.first_name ?? null,
          customerLastName: row.lastName ?? row.last_name ?? null,
          customerEmail: row.customerEmail ?? row.customer_email ?? null,
          // Collector fields at top level
          assignedEmployeeName: row.assignedEmployeeName ?? row.assigned_employee_name ?? null,
          assignedEmployeeId: row.assignedEmployeeId ?? row.assigned_employee_id ?? null,
          type: 'application', // Mark as application
        }));
      }
    }
    
    // Combine loans and applications
    const combinedData = [...loanData, ...applicationData];
    
    console.log('✅ [GET LOANS SERVICE] Returning:', loanData.length, 'loans +', applicationData.length, 'applications =', combinedData.length, 'total');

    return {
      data: combinedData,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: total + applicationData.length,
        pages: total > 0 ? Math.ceil((total + applicationData.length) / limitNumber) : 0,
      },
    };
  }

  async getCollectorPendingDisbursements(tenantId: number, collectorId: number) {
    const knex = this.knexService.instance;

    const { LoanCalculatorService } = require('./loan-calculator.service');
    const calculator = new LoanCalculatorService();
    const clampAmount = (value: any) => {
      const num = Number(value ?? 0);
      if (!Number.isFinite(num)) {
        return 0;
      }
      return Math.round(num * 100) / 100;
    };
    const getNumber = (row: any, keys: string[], fallback = 0) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null) {
          const num = Number(row[key]);
          if (!Number.isNaN(num)) {
            return num;
          }
        }
      }
      return fallback;
    };

    const getString = (row: any, keys: string[], fallback: string | null = null) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null) {
          return row[key];
        }
      }
      return fallback;
    };

    const normalizeIds = (items: unknown[]): number[] =>
      (items || [])
        .map((value) => {
          try {
            const coerced = Number(value);
            return Number.isFinite(coerced) ? coerced : null;
          } catch (error) {
            console.error('❌ [getCollectorPendingDisbursements] Failed to normalize ID', {
              value,
              error,
            });
            return null;
          }
        })
        .filter((value): value is number => value !== null);

    const directAssignmentsRaw = await knex('customers')
      .where({ tenant_id: tenantId, assigned_employee_id: collectorId })
      .pluck('id');

    let explicitAssignmentsRaw: unknown[] = [];
    try {
      explicitAssignmentsRaw = await knex('money_loan_collector_assignments')
        .where({ tenant_id: tenantId, collector_id: collectorId, is_active: true })
        .pluck('customer_id');
    } catch (error: any) {
      if (error?.code === '42P01') {
        console.warn('⚠️ [getCollectorPendingDisbursements] Collector assignment table missing, continuing with direct assignments only');
        explicitAssignmentsRaw = [];
      } else {
        throw error;
      }
    }

    const directAssignments = normalizeIds(directAssignmentsRaw as unknown[]);
    const explicitAssignments = normalizeIds(explicitAssignmentsRaw as unknown[]);

    const assignedCustomerIds = Array.from(new Set([...directAssignments, ...explicitAssignments]));

    if (!assignedCustomerIds.length) {
      console.log('ℹ️ [getCollectorPendingDisbursements] No assigned customers for collector', collectorId);
      return [];
    }

    const loans = await knex('money_loan_loans as mll')
      .leftJoin('customers as c', 'mll.customer_id', 'c.id')
      .leftJoin('money_loan_products as mlp', 'mll.loan_product_id', 'mlp.id')
      .leftJoin('users as assigned_emp', 'c.assigned_employee_id', 'assigned_emp.id')
      .select(
        'mll.id as loan_id',
        'mll.loan_number',
        'mll.customer_id',
        'mll.principal_amount',
        'mll.processing_fee',
        'mll.term_days',
        'mll.interest_rate',
        'mll.interest_type',
        'mll.status',
        'mll.created_at as loan_created_at',
        'mll.updated_at as loan_updated_at',
        'mll.disbursement_date',
        'c.first_name as customer_first_name',
        'c.last_name as customer_last_name',
        'c.email as customer_email',
        'c.assigned_employee_id',
        'mlp.processing_fee_percent',
        'mlp.platform_fee',
        'mlp.payment_frequency',
        'mlp.interest_type as product_interest_type',
        'mlp.interest_rate as product_interest_rate',
        'mlp.fixed_term_days',
        knex.raw("CONCAT_WS(' ', assigned_emp.first_name, assigned_emp.last_name) as assigned_employee_name"),
      )
  .where('mll.tenant_id', tenantId)
  .whereIn('mll.customer_id', assignedCustomerIds)
      .whereIn('mll.status', ['pending', 'approved'])
      .orderBy('mll.created_at', 'desc');

    const mappedLoans = loans.map((row: any) => {
      const principalAmount = getNumber(row, ['principalAmount', 'principal_amount'], 0);
      const productProcessingPercent = getNumber(row, ['processingFeePercent', 'processing_fee_percent', 'productProcessingFeePercent'], 0);
      const productPlatformFee = getNumber(row, ['platformFee', 'platform_fee', 'productPlatformFee'], 0);
      const termDays = getNumber(row, ['termDays', 'term_days', 'fixedTermDays', 'fixed_term_days'], 30);
      const termMonths = termDays / 30;
      const interestRate = getNumber(row, ['interestRate', 'interest_rate', 'productInterestRate', 'product_interest_rate'], 0);
      const interestType = getString(row, ['interestType', 'interest_type', 'productInterestType', 'product_interest_type'], 'flat') ?? 'flat';
      const paymentFrequency = getString(row, ['paymentFrequency', 'payment_frequency'], 'weekly') ?? 'weekly';

  let processingFee = clampAmount(getNumber(row, ['processingFee', 'processing_fee'], 0));
  let platformFee = 0;
  let netDisbursement = principalAmount;
    const loanIdValue = getNumber(row, ['loanId', 'loan_id', 'id'], NaN);
    const loanId = Number.isNaN(loanIdValue) ? null : loanIdValue;
    const customerIdValue = getNumber(row, ['customerId', 'customer_id'], NaN);
    const customerId = Number.isNaN(customerIdValue) ? null : customerIdValue;
    const loanNumber = getString(row, ['loanNumber', 'loan_number'], null);
    const initialInterestAmount = getNumber(row, ['interestAmount', 'totalInterest', 'total_interest'], NaN);
    let interestAmount = Number.isNaN(initialInterestAmount)
      ? clampAmount(principalAmount * (interestRate / 100) * Math.max(termMonths || 1, 1))
      : clampAmount(initialInterestAmount);
    let totalRepayable = clampAmount(
      getNumber(
        row,
        ['totalRepayable', 'total_repayable', 'totalAmount', 'total_amount'],
        principalAmount + interestAmount + clampAmount(productPlatformFee * termMonths),
      ),
    );

      try {
        const calculation = calculator.calculate({
          loanAmount: principalAmount,
          termMonths,
          paymentFrequency,
          interestRate,
          interestType,
          processingFeePercentage: productProcessingPercent,
          platformFee: productPlatformFee,
        });

        processingFee = clampAmount(calculation.processingFeeAmount);
        platformFee = clampAmount(calculation.platformFee);
        netDisbursement = clampAmount(calculation.netProceeds);
        interestAmount = clampAmount(calculation.interestAmount);
        totalRepayable = clampAmount(calculation.totalRepayable);
      } catch (error) {
        console.error('❌ [getCollectorPendingDisbursements] Loan calculation failed', {
          loanId: loanId ?? loanIdValue ?? row.loan_id ?? row.loanId ?? null,
          error: error?.message,
        });

        const fallbackProcessing = principalAmount * (productProcessingPercent / 100);
        const fallbackPlatform = productPlatformFee * termMonths;

        processingFee = clampAmount(fallbackProcessing || processingFee);
        platformFee = clampAmount(fallbackPlatform);
        netDisbursement = clampAmount(principalAmount - processingFee - platformFee);
      }

      const customerFirstName = getString(row, ['customerFirstName', 'customer_first_name', 'firstName', 'first_name'], '');
      const customerLastName = getString(row, ['customerLastName', 'customer_last_name', 'lastName', 'last_name'], '');
      const customerFullName = `${customerFirstName ?? ''} ${customerLastName ?? ''}`.trim();
  const approvedAt = getString(row, ['disbursementDate', 'disbursement_date', 'loanUpdatedAt', 'loan_updated_at', 'loanCreatedAt', 'loan_created_at'], null);
      const customerEmail = getString(row, ['customerEmail', 'customer_email', 'email'], null);
  const assignedEmployeeIdValue = getNumber(row, ['assignedEmployeeId', 'assigned_employee_id'], NaN);
  const assignedEmployeeId = Number.isNaN(assignedEmployeeIdValue) ? null : assignedEmployeeIdValue;
  const assignedEmployeeName = getString(row, ['assignedEmployeeName', 'assigned_employee_name'], null);

      return {
        id: loanId ?? customerId ?? 0,
        loanNumber: loanNumber ?? null,
        applicationNumber: null,
        applicationId: null,
        customerId: customerId ?? 0,
        customerName: customerFullName || customerEmail || (customerId != null ? `Customer #${customerId}` : 'Customer'),
        principalAmount,
        processingFee,
        processingFeePercent: productProcessingPercent,
        processing_fee_percent: productProcessingPercent,
        platformFee,
        platformFeeMonthly: productPlatformFee,
        platform_fee_monthly: productPlatformFee,
        netDisbursement: netDisbursement < 0 ? 0 : netDisbursement,
        approvedAt,
        status: row.status ?? 'pending',
        type: 'loan',
        interestRate,
        interestType,
        interestAmount,
        totalRepayable,
        termDays,
        termMonths,
        paymentFrequency,
        customer: {
          fullName: customerFullName || customerEmail || 'N/A',
          email: customerEmail,
          firstName: customerFirstName ?? null,
          lastName: customerLastName ?? null,
          assignedEmployeeId: assignedEmployeeId ?? null,
          assignedEmployeeName: assignedEmployeeName ?? null,
        },
      };
    });

    const applications = await knex('money_loan_applications as mla')
      .leftJoin('customers as c', 'mla.customer_id', 'c.id')
      .leftJoin('money_loan_products as mlp', 'mla.loan_product_id', 'mlp.id')
      .leftJoin('users as assigned_emp', 'c.assigned_employee_id', 'assigned_emp.id')
      .select(
        'mla.id as application_id',
        'mla.application_number',
        'mla.customer_id',
        'mla.loan_product_id',
        'mla.requested_amount',
        'mla.approved_amount',
        'mla.requested_term_days',
        'mla.approved_term_days',
        'mla.approved_interest_rate',
        'mla.status',
        'mla.reviewed_at',
        'mla.updated_at',
        'mla.created_at',
        'c.first_name as customer_first_name',
        'c.last_name as customer_last_name',
        'c.email as customer_email',
        'c.assigned_employee_id',
        'mlp.processing_fee_percent',
        'mlp.platform_fee',
        'mlp.payment_frequency',
        'mlp.interest_type',
        'mlp.interest_rate',
        'mlp.fixed_term_days',
        knex.raw("CONCAT_WS(' ', assigned_emp.first_name, assigned_emp.last_name) as assigned_employee_name"),
      )
  .where('mla.tenant_id', tenantId)
  .whereIn('mla.customer_id', assignedCustomerIds)
      .where('mla.status', 'approved')
      .whereNotExists(function () {
        this.select('*')
          .from('money_loan_loans')
          .whereRaw('money_loan_loans.application_id = mla.id')
          .where('money_loan_loans.tenant_id', tenantId);
      })
      .orderBy('mla.updated_at', 'desc');

    const mappedApplications = applications.map((row: any) => {
      const principalAmount = getNumber(row, ['approvedAmount', 'approved_amount', 'requestedAmount', 'requested_amount'], 0);
      const termDays = getNumber(row, ['approvedTermDays', 'approved_term_days', 'requestedTermDays', 'requested_term_days', 'fixedTermDays', 'fixed_term_days'], 30);
      const termMonths = termDays / 30;
      const processingPercent = getNumber(row, ['processingFeePercent', 'processing_fee_percent'], 0);
      const platformFeePerMonth = getNumber(row, ['platformFee', 'platform_fee'], 0);
      const interestRate = getNumber(row, ['approvedInterestRate', 'approved_interest_rate', 'interestRate', 'interest_rate'], 0);
      const interestType = getString(row, ['interestType', 'interest_type'], 'flat') ?? 'flat';
      const paymentFrequency = getString(row, ['paymentFrequency', 'payment_frequency'], 'weekly') ?? 'weekly';

  let processingFee = 0;
  let platformFee = 0;
  let netDisbursement = principalAmount;
    const applicationIdValue = getNumber(row, ['applicationId', 'application_id', 'id'], NaN);
    const applicationId = Number.isNaN(applicationIdValue) ? null : applicationIdValue;
    const customerIdValue = getNumber(row, ['customerId', 'customer_id'], NaN);
    const customerId = Number.isNaN(customerIdValue) ? null : customerIdValue;
    const applicationNumber = getString(row, ['applicationNumber', 'application_number'], null);
  const loanProductIdValue = getNumber(row, ['loanProductId', 'loan_product_id'], NaN);
  const loanProductId = Number.isNaN(loanProductIdValue) ? null : loanProductIdValue;
    const initialInterestAmount = getNumber(row, ['interestAmount', 'totalInterest', 'total_interest'], NaN);
    let interestAmount = Number.isNaN(initialInterestAmount)
      ? clampAmount(principalAmount * (interestRate / 100) * Math.max(termMonths || 1, 1))
      : clampAmount(initialInterestAmount);
    let totalRepayable = clampAmount(
      getNumber(
        row,
        ['totalRepayable', 'total_repayable', 'totalAmount', 'total_amount'],
        principalAmount + interestAmount + clampAmount(platformFeePerMonth * termMonths),
      ),
    );

      try {
        const calculation = calculator.calculate({
          loanAmount: principalAmount,
          termMonths,
          paymentFrequency,
          interestRate,
          interestType,
          processingFeePercentage: processingPercent,
          platformFee: platformFeePerMonth,
        });

        processingFee = clampAmount(calculation.processingFeeAmount);
        platformFee = clampAmount(calculation.platformFee);
        netDisbursement = clampAmount(calculation.netProceeds);
        interestAmount = clampAmount(calculation.interestAmount);
        totalRepayable = clampAmount(calculation.totalRepayable);
      } catch (error) {
        console.error('❌ [getCollectorPendingDisbursements] Application calculation failed', {
          applicationId: applicationId ?? applicationIdValue ?? row.application_id ?? row.applicationId ?? null,
          error: error?.message,
        });

        processingFee = clampAmount(principalAmount * (processingPercent / 100));
        platformFee = clampAmount(platformFeePerMonth * termMonths);
        netDisbursement = clampAmount(principalAmount - processingFee - platformFee);
      }
      const customerFirstName = getString(row, ['customerFirstName', 'customer_first_name', 'firstName', 'first_name'], '');
      const customerLastName = getString(row, ['customerLastName', 'customer_last_name', 'lastName', 'last_name'], '');
      const customerEmail = getString(row, ['customerEmail', 'customer_email', 'email'], null);
      const customerFullName = `${customerFirstName ?? ''} ${customerLastName ?? ''}`.trim();
      const approvedAt = getString(row, ['reviewedAt', 'reviewed_at', 'updatedAt', 'updated_at', 'createdAt', 'created_at'], null);
  const assignedEmployeeIdValue = getNumber(row, ['assignedEmployeeId', 'assigned_employee_id'], NaN);
  const assignedEmployeeId = Number.isNaN(assignedEmployeeIdValue) ? null : assignedEmployeeIdValue;
  const assignedEmployeeName = getString(row, ['assignedEmployeeName', 'assigned_employee_name'], null);

      return {
        id: applicationId ?? customerId ?? 0,
        loanNumber: `PENDING-${applicationNumber ?? applicationId ?? ''}`,
        applicationNumber: applicationNumber ?? null,
        applicationId: applicationId ?? null,
        customerId: customerId ?? 0,
        customerName: customerFullName || customerEmail || (customerId != null ? `Customer #${customerId}` : 'Customer'),
        principalAmount,
        processingFee,
  processingFeePercent: processingPercent,
  processing_fee_percent: processingPercent,
        platformFee,
  platformFeeMonthly: platformFeePerMonth,
  platform_fee_monthly: platformFeePerMonth,
        netDisbursement: netDisbursement < 0 ? 0 : netDisbursement,
        approvedAt,
        status: 'pending',
        type: 'application',
        interestRate,
        interestType,
        interestAmount,
        totalRepayable,
        termDays,
        termMonths,
        paymentFrequency,
        customer: {
          fullName: customerFullName || customerEmail || 'N/A',
          email: customerEmail,
          firstName: customerFirstName ?? null,
          lastName: customerLastName ?? null,
          assignedEmployeeId: assignedEmployeeId ?? null,
          assignedEmployeeName: assignedEmployeeName ?? null,
        },
        loanProductId,
      };
    });

    console.log('📋 [getCollectorPendingDisbursements] Loans:', mappedLoans.length, 'Applications:', mappedApplications.length);

    return [...mappedLoans, ...mappedApplications];
  }

  async getLoanById(tenantId: number, loanId: number) {
    const knex = this.knexService.instance;

    const [loan] = await knex('money_loan_loans as mll')
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

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    return this.mapLoanRow(loan);
  }

  async disburseLoan(tenantId: number, loanId: number, disburseDto: DisburseLoanDto, disbursedBy: number) {
    const knex = this.knexService.instance;

    // First, check if this is an approved application that needs disbursement
    const application = await knex('money_loan_applications')
      .where({ id: loanId, tenant_id: tenantId, status: 'approved' })
      .first();

    if (application) {
      // Check if a loan already exists for this application
      const existingLoan = await knex('money_loan_loans')
        .where({ application_id: application.id, tenant_id: tenantId })
        .first();

      if (existingLoan) {
        throw new BadRequestException('This application has already been disbursed');
      }

      console.log('📋 Found approved application, creating loan for disbursement:', application);

      // Get product details for loan calculation
      const product = await knex('money_loan_products')
        .where({ id: application.loanProductId })
        .first();

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Use the approved values from the application
      const { LoanCalculatorService } = require('./loan-calculator.service');
      const calculator = new LoanCalculatorService();

      // Convert string values to numbers
      const approvedAmount = parseFloat(application.approvedAmount || application.approved_amount);
      const approvedTermDays = parseInt(application.approvedTermDays || application.approved_term_days);
      const approvedInterestRate = parseFloat(application.approvedInterestRate || application.approved_interest_rate);
      const processingFeePercent = parseFloat(product.processingFeePercent || 0);
      const platformFee = parseFloat(product.platformFee || 0);

      const termMonths = approvedTermDays / 30;
      const paymentFrequency = product.paymentFrequency || 'weekly';
      
      const calculation = calculator.calculate({
        loanAmount: approvedAmount,
        termMonths,
        paymentFrequency: paymentFrequency as 'daily' | 'weekly' | 'biweekly' | 'monthly',
        interestRate: approvedInterestRate,
        interestType: product.interestType || 'flat',
        processingFeePercentage: processingFeePercent,
        platformFee: platformFee,
      });

      const loanNumber = `LOAN-${tenantId}-${Date.now()}`;

      // Create the loan record with proper numeric values
      const loanData = {
        tenant_id: tenantId,
        customer_id: application.customerId,
        loan_product_id: application.loanProductId,
        application_id: application.id,
        loan_number: loanNumber,
        principal_amount: Number(calculation.loanAmount),
        interest_rate: Number(approvedInterestRate),
        interest_type: product.interestType || 'flat',
        term_days: Number(approvedTermDays),
        processing_fee: Number(calculation.processingFeeAmount),
        total_interest: Number(calculation.interestAmount),
        total_amount: Number(calculation.totalRepayable),
        outstanding_balance: Number(calculation.totalRepayable),
        monthly_payment: Number(calculation.monthlyEquivalent || calculation.installmentAmount),
        status: 'active',
        disbursement_date: knex.fn.now(),
        disbursed_by: disbursedBy,
        disbursement_method: disburseDto.disbursementMethod,
        disbursement_reference: disburseDto.disbursementReference,
        disbursement_notes: disburseDto.disbursementNotes,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      };

      console.log('💾 Creating loan for disbursement:', loanData);

      const [createdLoan] = await knex('money_loan_loans')
        .insert(loanData)
        .returning('*');

      // Update application status to 'disbursed'
      await knex('money_loan_applications')
        .where({ id: application.id, tenant_id: tenantId })
        .update({
          status: 'disbursed',
          updated_at: knex.fn.now(),
        });

      console.log('✅ Loan created and application status updated to disbursed');

      // Return the created loan with customer and product details
      const [loanWithDetails] = await knex('money_loan_loans as mll')
        .leftJoin('customers as c', 'mll.customer_id', 'c.id')
        .leftJoin('money_loan_products as mlp', 'mll.loan_product_id', 'mlp.id')
        .select(
          'mll.*',
          'c.first_name',
          'c.last_name',
          'c.email as customer_email',
          'mlp.name as product_name'
        )
        .where('mll.id', createdLoan.id)
        .limit(1);

      return this.mapLoanRow(loanWithDetails);
    }

    // If not an application, check if it's an existing loan that needs disbursement
    const loan = await knex('money_loan_loans')
      .where({ id: loanId, tenant_id: tenantId })
      .first();

    if (!loan) {
      throw new NotFoundException('Loan or approved application not found');
    }

    // If loan exists (old flow), update it
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

    // Update corresponding application status to 'disbursed' if exists
    if (loan.application_id) {
      await knex('money_loan_applications')
        .where({ id: loan.application_id, tenant_id: tenantId })
        .update({
          status: 'disbursed',
          updated_at: knex.fn.now(),
        });
    }

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

    // Explicitly map financial fields to ensure they are numbers
    const principalAmount = parseFloat(row.principalAmount || row.principal_amount || 0);
    const totalInterest = parseFloat(row.totalInterest || row.total_interest || 0);
    const totalAmount = parseFloat(row.totalAmount || row.total_amount || 0);
    const amountPaid = parseFloat(row.amountPaid || row.amount_paid || 0);
    const outstandingBalance = parseFloat(row.outstandingBalance || row.outstanding_balance || principalAmount);
    const processingFee = parseFloat(row.processingFee || row.processing_fee || 0);
    const penaltyAmount = parseFloat(row.penaltyAmount || row.penalty_amount || 0);
    const interestRate = parseFloat(row.interestRate || row.interest_rate || 0);
    const monthlyPayment = row.monthlyPayment || row.monthly_payment || null;

    // Build full name from first_name and last_name
    const firstName = row.firstName || row.first_name || '';
    const lastName = row.lastName || row.last_name || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    // Build assigned employee name
    const assignedEmployeeName = row.assignedEmployeeName || row.assigned_employee_name || '';

    return {
      ...row,
      // Override with explicitly parsed values
      principalAmount,
      totalInterest,
      totalAmount,
      amountPaid,
      outstandingBalance,
      processingFee,
      penaltyAmount,
      interestRate,
      monthlyPayment: monthlyPayment ? parseFloat(monthlyPayment) : null,
      termDays: parseInt(row.termDays || row.term_days || 0),
      daysOverdue: parseInt(row.daysOverdue || row.days_overdue || 0),
      loanTermMonths,
      customer: {
        fullName: fullName || 'N/A',
        customerCode: row.customerEmail || row.customer_email || (row.customerId ? `CUST-${row.customerId}` : undefined),
        email: (row.customerEmail || row.customer_email) ?? undefined,
        firstName: firstName,
        lastName: lastName,
        assignedEmployeeId: row.assignedEmployeeId || row.assigned_employee_id || null,
        assignedEmployeeName: assignedEmployeeName || null,
      },
      // Also include at top level for collector column
      assignedEmployeeName: assignedEmployeeName || null,
      assignedEmployeeId: row.assignedEmployeeId || row.assigned_employee_id || null,
      productName: row.productName || row.product_name,
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
      const newAmountPaid = Number(loan.amountPaid || loan.amount_paid || 0) + createPaymentDto.amount;

      await trx('money_loan_loans')
        .where({ id: createPaymentDto.loanId })
        .update({
          outstanding_balance: newBalance,
          amount_paid: newAmountPaid,
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

  async getAllPayments(tenantId: number) {
    const knex = this.knexService.instance;

    return await knex('money_loan_payments')
      .select(
        'money_loan_payments.*',
        'money_loan_loans.loan_number',
        'customers.first_name as customer_first_name',
        'customers.last_name as customer_last_name'
      )
      .leftJoin('money_loan_loans', 'money_loan_payments.loan_id', 'money_loan_loans.id')
      .leftJoin('customers', 'money_loan_payments.customer_id', 'customers.id')
      .where({ 'money_loan_payments.tenant_id': tenantId })
      .orderBy('money_loan_payments.created_at', 'desc');
  }

  async getTodayCollections(tenantId: number) {
    const knex = this.knexService.instance;

    // Get today's date range (start and end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayEnd = tomorrow.toISOString();

    // Get all payments made today
    const payments = await knex('money_loan_payments as mlp')
      .select(
        'mlp.id',
        'mlp.payment_reference',
        'mlp.loan_id',
        'mlp.customer_id',
        'mlp.amount',
        'mlp.principal_amount',
        'mlp.interest_amount',
        'mlp.penalty_amount',
        'mlp.payment_method',
        'mlp.payment_date',
        'mlp.status',
        'mlp.created_at',
        'mll.loan_number',
        'c.first_name as customer_first_name',
        'c.last_name as customer_last_name'
      )
      .leftJoin('money_loan_loans as mll', 'mlp.loan_id', 'mll.id')
      .leftJoin('customers as c', 'mlp.customer_id', 'c.id')
      .where('mlp.tenant_id', tenantId)
      .whereBetween('mlp.payment_date', [todayStart, todayEnd])
      .orderBy('mlp.created_at', 'desc');

    // Calculate summary statistics
    const completedPayments = payments.filter(p => p.status === 'completed');
    const summary = {
      date: today.toISOString().split('T')[0],
      totalPayments: completedPayments.length,
      totalAmount: completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
      principalCollected: completedPayments.reduce((sum, p) => sum + parseFloat(p.principal_amount || 0), 0),
      interestCollected: completedPayments.reduce((sum, p) => sum + parseFloat(p.interest_amount || 0), 0),
      penaltyCollected: completedPayments.reduce((sum, p) => sum + parseFloat(p.penalty_amount || 0), 0),
    };

    // Get today's expected payments from repayment schedules
    const expectedPaymentsResult = await knex('money_loan_repayment_schedules as mlrs')
      .select(knex.raw('COALESCE(SUM(mlrs.total_amount), 0) as total_expected'))
      .where('mlrs.tenant_id', tenantId)
      .whereBetween('mlrs.due_date', [todayStart, todayEnd])
      .whereIn('mlrs.status', ['pending', 'partially_paid', 'overdue'])
      .first();

    const expectedAmount = parseFloat((expectedPaymentsResult as any)?.total_expected || 0);
    const collectionRate = expectedAmount > 0 ? Math.min(100, Math.round((summary.totalAmount / expectedAmount) * 100)) : 0;

    // Format payment details with customer names
    const formattedPayments = payments.map(p => ({
      id: p.id,
      paymentReference: p.payment_reference,
      loanNumber: p.loan_number,
      customerName: `${p.customer_first_name || ''} ${p.customer_last_name || ''}`.trim() || 'Unknown',
      amount: parseFloat(p.amount || 0),
      principalAmount: parseFloat(p.principal_amount || 0),
      interestAmount: parseFloat(p.interest_amount || 0),
      penaltyAmount: parseFloat(p.penalty_amount || 0),
      paymentMethod: p.payment_method,
      paymentDate: p.payment_date,
      status: p.status,
      createdAt: p.created_at,
    }));

    return {
      summary: {
        ...summary,
        expectedAmount,
        collectionRate,
      },
      payments: formattedPayments,
    };
  }

  async generateRepaymentSchedule(tenantId: number, loanId: number) {
    const knex = this.knexService.instance;

    // Get loan details with product information
    const loan = await knex('money_loan_loans as mll')
      .leftJoin('money_loan_products as mlp', 'mll.loan_product_id', 'mlp.id')
      .select(
        'mll.*',
        'mlp.payment_frequency as product_payment_frequency',
        'mlp.interest_rate as product_interest_rate',
        'mlp.interest_type as product_interest_type'
      )
      .where('mll.id', loanId)
      .andWhere('mll.tenant_id', tenantId)
      .first();

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    // Get all payments for this loan
    const payments = await knex('money_loan_payments')
      .where({ tenant_id: tenantId, loan_id: loanId })
      .orderBy('payment_date', 'asc');

    // Extract loan parameters (supporting both snake_case and camelCase)
    const principalAmount = parseFloat(loan.principal_amount || loan.principalAmount) || 0;
    const totalAmount = parseFloat(loan.total_amount || loan.totalAmount) || 0;
    const termDays = loan.term_days || loan.termDays || 30;
    const paymentFrequency = loan.payment_frequency || loan.paymentFrequency || loan.product_payment_frequency || loan.productPaymentFrequency || 'weekly';
    const disbursementDateValue = loan.disbursement_date || loan.disbursementDate;
    const disbursementDate = disbursementDateValue ? new Date(disbursementDateValue) : new Date();

    console.log('📊 Loan financial data:', {
      principalAmount,
      totalAmount,
      termDays,
      paymentFrequency
    });

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

    // Calculate installment amount from actual total (not recalculating fees)
    const amountPerInstallment = Math.round((totalAmount / numberOfInstallments) * 100) / 100;
    const totalOfRegularInstallments = amountPerInstallment * (numberOfInstallments - 1);
    const lastInstallmentAmount = Math.round((totalAmount - totalOfRegularInstallments) * 100) / 100;

    console.log('📊 Repayment Schedule:', {
      numberOfInstallments,
      daysBetweenPayments,
      amountPerInstallment,
      lastInstallmentAmount,
      totalAmount
    });

    // Calculate total paid from payments
    let totalPaid = 0;
    for (const payment of payments) {
      totalPaid += parseFloat(payment.amount) || 0;
    }

    console.log('💰 Total Paid So Far:', totalPaid);

    // Generate installment schedule
    const schedule = [];
    const totalInterest = parseFloat(loan.total_interest || loan.totalInterest) || 0;

    for (let i = 1; i <= numberOfInstallments; i++) {
      const dueDate = new Date(disbursementDate);
      dueDate.setDate(dueDate.getDate() + (i * daysBetweenPayments));

      // Use the last installment amount for the final payment to account for rounding
      const installmentAmount = i === numberOfInstallments ? lastInstallmentAmount : amountPerInstallment;

      // Calculate how much of this installment has been paid
      const previousInstallmentsTotal = (i - 1) * amountPerInstallment;
      
      let amountPaidForThisInstallment = 0;
      if (totalPaid > previousInstallmentsTotal) {
        amountPaidForThisInstallment = Math.min(
          totalPaid - previousInstallmentsTotal,
          installmentAmount
        );
      }

      // Determine status
      let status = 'pending';
      if (amountPaidForThisInstallment >= installmentAmount - 0.01) { // Small tolerance for rounding
        status = 'paid';
      } else if (amountPaidForThisInstallment > 0) {
        status = 'partial';
      } else if (new Date() > dueDate) {
        status = 'overdue';
      }

      const daysOverdue = status === 'overdue' 
        ? Math.max(0, Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))) 
        : 0;

      console.log(`📅 Installment ${i}: totalDue=${installmentAmount.toFixed(2)}, paid=${amountPaidForThisInstallment.toFixed(2)}, status=${status}`);

      // Return in both snake_case and camelCase for compatibility
      schedule.push({
        id: i,
        installmentNumber: i,
        installment_number: i,
        dueDate: dueDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        principalAmount: Math.round((installmentAmount * (principalAmount / totalAmount)) * 100) / 100,
        principal_due: Math.round((installmentAmount * (principalAmount / totalAmount)) * 100) / 100,
        interestAmount: Math.round((installmentAmount * (totalInterest / totalAmount)) * 100) / 100,
        interest_due: Math.round((installmentAmount * (totalInterest / totalAmount)) * 100) / 100,
        totalAmount: installmentAmount,
        total_due: installmentAmount,
        amountPaid: Math.round(amountPaidForThisInstallment * 100) / 100,
        amount_paid: Math.round(amountPaidForThisInstallment * 100) / 100,
        outstandingAmount: Math.round((installmentAmount - amountPaidForThisInstallment) * 100) / 100,
        penaltyAmount: 0,
        status: status === 'partial' ? 'partially_paid' : status,
        daysOverdue
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

    const products = await query;
    
    console.log('🔍 [GET PRODUCTS] Raw products from DB:', products);
    
    // Transform database fields to camelCase with proper formatting
    const transformed = await Promise.all(products.map(product => this.transformProductFields(product)));
    
    console.log('✅ [GET PRODUCTS] Transformed products:', transformed);
    
    return transformed;
  }

  async getProductById(tenantId: number, productId: number) {
    const knex = this.knexService.instance;

    const product = await knex('money_loan_products')
      .where({ tenant_id: tenantId, id: productId })
      .first();

    if (!product) {
      throw new NotFoundException('Loan product not found');
    }

    // Transform database fields to camelCase with proper formatting
    return await this.transformProductFields(product);
  }

  private async transformProductFields(product: any) {
    const knex = this.knexService.instance;
    
    // Get assigned customer IDs if availability_type is 'selected'
    let selectedCustomerIds = [];
    if (product.availabilityType === 'selected') {
      const assignments = await knex('money_loan_product_customers')
        .where('product_id', product.id)
        .pluck('customer_id');
      selectedCustomerIds = assignments;
    }
    
    // Knex postProcessResponse already converts snake_case to camelCase
    // Just add the selectedCustomerIds from the junction table
    return {
      ...product,
      selectedCustomerIds,
    };
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
      deduct_platform_fee_in_advance: dto.deductPlatformFeeInAdvance ?? false,
      deduct_processing_fee_in_advance: dto.deductProcessingFeeInAdvance ?? false,
      deduct_interest_in_advance: dto.deductInterestInAdvance ?? false,
      availability_type: dto.availabilityType ?? 'all',
    };

    this.sanitizePayload(insertPayload);

    try {
      const [result] = await knex('money_loan_products')
        .insert(insertPayload)
        .returning('id');

      const createdId = typeof result === 'object' ? result.id : result;
      
      // Handle customer assignments if availabilityType is 'selected'
      if (dto.availabilityType === 'selected' && dto.selectedCustomerIds && dto.selectedCustomerIds.length > 0) {
        const customerAssignments = dto.selectedCustomerIds.map(customerId => ({
          product_id: createdId,
          customer_id: customerId,
        }));
        await knex('money_loan_product_customers').insert(customerAssignments);
      }
      
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

    const existingMinAmount = Number(existing.minAmount ?? 0);
    const existingMaxAmount = Number(existing.maxAmount ?? 0);
    const minAmount = dto.minAmount ?? existingMinAmount;
    const maxAmount = dto.maxAmount ?? existingMaxAmount;

    if (minAmount > maxAmount) {
      throw new BadRequestException('Minimum amount cannot be greater than maximum amount');
    }

    const existingLoanTermType = existing.loanTermType ?? LoanTermType.FLEXIBLE;
    const targetLoanTermType = dto.loanTermType ?? existingLoanTermType;

    if (targetLoanTermType === LoanTermType.FIXED) {
      const fixedTermDays = dto.fixedTermDays ?? existing.fixedTermDays;
      if (!fixedTermDays || fixedTermDays <= 0) {
        throw new BadRequestException('fixedTermDays is required for fixed term products');
      }
    } else {
      const minTermDays = dto.minTermDays ?? existing.minTermDays;
      const maxTermDays = dto.maxTermDays ?? existing.maxTermDays;
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
    if (dto.deductPlatformFeeInAdvance !== undefined) {
      updates.deduct_platform_fee_in_advance = dto.deductPlatformFeeInAdvance;
    }
    if (dto.deductProcessingFeeInAdvance !== undefined) {
      updates.deduct_processing_fee_in_advance = dto.deductProcessingFeeInAdvance;
    }
    if (dto.deductInterestInAdvance !== undefined) {
      updates.deduct_interest_in_advance = dto.deductInterestInAdvance;
    }
    if (dto.availabilityType !== undefined) {
      updates.availability_type = dto.availabilityType;
    }

    if (targetLoanTermType === LoanTermType.FIXED) {
      updates.fixed_term_days = dto.fixedTermDays ?? existing.fixedTermDays;
      updates.min_term_days = null;
      updates.max_term_days = null;
    } else {
      updates.fixed_term_days = null;

      if (dto.minTermDays !== undefined || existingLoanTermType === LoanTermType.FIXED) {
        updates.min_term_days = dto.minTermDays ?? existing.minTermDays ?? null;
      }

      if (dto.maxTermDays !== undefined || existingLoanTermType === LoanTermType.FIXED) {
        updates.max_term_days = dto.maxTermDays ?? existing.maxTermDays ?? null;
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
      
      // Handle customer assignments if availabilityType is updated
      if (dto.availabilityType !== undefined) {
        // Delete existing assignments
        await knex('money_loan_product_customers')
          .where({ product_id: productId })
          .del();
        
        // Add new assignments if selected
        if (dto.availabilityType === 'selected' && dto.selectedCustomerIds && dto.selectedCustomerIds.length > 0) {
          const customerAssignments = dto.selectedCustomerIds.map(customerId => ({
            product_id: productId,
            customer_id: customerId,
          }));
          await knex('money_loan_product_customers').insert(customerAssignments);
        }
      }
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
      .leftJoin('users as assigned', 'c.assigned_employee_id', 'assigned.id')
      .select(
        'c.id',
        'c.customer_code as customerCode',
        'c.first_name as firstName',
        'c.last_name as lastName',
        'c.email',
        'c.phone',
        'c.status',
        'c.assigned_employee_id as assignedEmployeeId',
        'mlcp.kyc_status as kycStatus',
        'mlcp.credit_score as creditScore',
        'mlcp.risk_level as riskLevel',
        knex.raw("CONCAT_WS(' ', assigned.first_name, assigned.last_name) as assignedEmployeeName"),
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
      .leftJoin('users as assigned', 'c.assigned_employee_id', 'assigned.id')
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

    // Add fullName to each customer
    const dataWithFullName = data.map(customer => ({
      ...customer,
      fullName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown Customer'
    }));

    return {
      data: dataWithFullName,
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
        'mlcp.risk_level as riskLevel'
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

  async assignCustomersToEmployee(
    tenantId: number,
    employeeId: number,
    customerIds: number[],
    assignedBy: number
  ) {
    const knex = this.knexService.instance;

    // Verify employee exists and is in the same tenant
    const employee = await knex('users')
      .where({ id: employeeId, tenant_id: tenantId })
      .first();

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Update customers with assignment
    const timestamp = knex.fn.now();
    await knex('customers')
      .whereIn('id', customerIds)
      .where({ tenant_id: tenantId })
      .update({
        assigned_employee_id: employeeId,
        assigned_by: assignedBy,
        assigned_at: timestamp,
        updated_at: timestamp,
      });

    return {
      employeeId,
      assignedCount: customerIds.length,
      assignedAt: new Date().toISOString(),
    };
  }

  async unassignCustomers(
    tenantId: number,
    customerIds: number[],
    unassignedBy: number
  ) {
    const knex = this.knexService.instance;

    // Update customers to remove assignment
    const timestamp = knex.fn.now();
    const result = await knex('customers')
      .whereIn('id', customerIds)
      .where({ tenant_id: tenantId })
      .whereNotNull('assigned_employee_id') // Only unassign if they're actually assigned
      .update({
        assigned_employee_id: null,
        assigned_by: null,
        assigned_at: null,
        assignment_notes: knex.raw(`CONCAT(COALESCE(assignment_notes, ''), '\n[', NOW(), '] Unassigned by user ', ?::text, '.')`, [unassignedBy]),
        updated_at: timestamp,
      });

    return {
      unassignedCount: result,
      unassignedAt: new Date().toISOString(),
    };
  }

  async getCollectorRoute(
    tenantId: number,
    collectorId: number
  ) {
    const knex = this.knexService.instance;

    // Query: Get all active loans for customers assigned to this collector
    // Returns one row per loan (not per customer)
    const loans = await knex('money_loan_loans as ml')
      .join('customers as c', 'ml.customer_id', 'c.id')
      .leftJoin('money_loan_products as mlp', 'ml.loan_product_id', 'mlp.id')
      .leftJoin('addresses as addr', function () {
        this.on('addr.addressable_id', '=', 'c.id')
          .andOn('addr.addressable_type', '=', knex.raw('?', ['customer']))
          .andOn('addr.is_primary', '=', knex.raw('true'));
      })
      .leftJoin('money_loan_repayment_schedules as rs', function () {
        this.on('rs.loan_id', '=', 'ml.id')
          .andOnIn('rs.status', ['pending', 'partially_paid']);
      })
      .select(
        // Customer info
        'c.id as customer_id',
        'c.first_name',
        'c.last_name',
        'c.phone',
        'c.email',
        knex.raw(
          "COALESCE(NULLIF(TRIM(CONCAT_WS(', ', addr.house_number, addr.street_name, addr.barangay, addr.city_municipality, addr.province)), ''), 'N/A') as full_address",
        ),
        // Loan info
        'ml.id as loan_id',
        'ml.loan_number',
        'ml.principal_amount',
        'ml.outstanding_balance',
        'ml.status as loan_status',
        'ml.disbursement_date',
        'mlp.name as product_name',
        // Next repayment info
        knex.raw('MIN(rs.installment_number) as next_installment'),
        knex.raw('MIN(rs.due_date) as next_due_date'),
        knex.raw('SUM(rs.outstanding_amount) as total_due')
      )
      .where('ml.tenant_id', tenantId)
      .where('c.assigned_employee_id', collectorId)
      .whereIn('ml.status', ['active', 'overdue'])
      .groupBy(
        'c.id',
        'c.first_name',
        'c.last_name',
        'c.phone',
        'c.email',
        'addr.house_number',
        'addr.street_name',
        'addr.barangay',
        'addr.city_municipality',
        'addr.province',
        'ml.id',
        'ml.loan_number',
        'ml.principal_amount',
        'ml.outstanding_balance',
        'ml.status',
        'ml.disbursement_date',
        'mlp.name'
      )
      .orderBy('c.first_name', 'asc')
      .orderBy('c.last_name', 'asc')
      .orderBy('ml.id', 'asc');

    console.log('📋 [GET COLLECTOR ROUTE] Retrieved', loans.length, 'loans for collector', collectorId);
    if (loans.length > 0) {
      console.log('📋 [GET COLLECTOR ROUTE] First loan raw data:', loans[0]);
    }

    return loans.map((loan) => {
      // Handle both snake_case and camelCase from database
      const firstName = loan.first_name || loan.firstName || '';
      const lastName = loan.last_name || loan.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      const dueDate = loan.next_due_date ? new Date(loan.next_due_date) : null;
      let formattedDueDate: string | null = null;
      if (dueDate && !Number.isNaN(dueDate.getTime())) {
        formattedDueDate = dueDate.toISOString();
      }

      const outstandingBalance = Number(loan.outstanding_balance ?? 0);
      const amountDue = Number(loan.total_due ?? 0);
      const nextInstallment = loan.next_installment ? Number(loan.next_installment) : null;

      // Determine status based on loan status and payment status
      let status: 'not-visited' | 'collected' | 'visited' | 'missed' = 'not-visited';
      if (loan.loan_status === 'overdue') {
        status = 'missed';
      } else if (amountDue <= 0 && outstandingBalance <= 0) {
        status = 'collected';
      } else if (amountDue <= 0 && outstandingBalance > 0) {
        status = 'visited';
      }

      const result = {
        customerId: loan.customerId ?? loan.customer_id,
        customerName: fullName || loan.email || 'Assigned Customer',
        address: loan.fullAddress ?? loan.full_address ?? 'N/A',
        phone: loan.phone ?? '',
        email: loan.email ?? '',
        // Loan specific info
        loanId: loan.loanId ?? loan.loan_id,
        loanNumber: loan.loanNumber ?? loan.loan_number,
        productName: loan.productName ?? loan.product_name,
        principalAmount: Number(loan.principalAmount ?? loan.principal_amount ?? 0),
        outstandingBalance,
        amountDue,
        nextInstallment,
        dueDate: formattedDueDate,
        status,
        disbursementDate: loan.disbursementDate ?? loan.disbursement_date,
      };

      console.log('📋 [GET COLLECTOR ROUTE] Mapped loan object:', result);
      return result;
    });
  }
}
