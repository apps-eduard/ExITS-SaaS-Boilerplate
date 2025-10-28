const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth');
const rbacMiddleware = require('../../../middleware/rbac');
const knex = require('../../../config/knex');

/**
 * @route GET /api/money-loan/loans/overview
 * @desc Get loan overview statistics
 * @access Private
 */
router.get('/loans/overview', authMiddleware, rbacMiddleware(['money-loan'], ['overview:view']), async (req, res) => {
  try {
    const { tenantId } = req.user;

    // Mock data for now - replace with actual database queries
    const overview = {
      totalLoans: 0,
      activeLoans: 0,
      pendingLoans: 0,
      totalDisbursed: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      overdueLoans: 0,
      overdueAmount: 0,
      collectionRate: 0,
      recentLoans: []
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Error fetching loan overview:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch loan overview' 
    });
  }
});

/**
 * @route GET /api/money-loan/customers
 * @desc Get customers list
 * @access Private
 */
router.get('/customers', authMiddleware, rbacMiddleware(['money-loan'], ['customers:read']), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { page = 1, limit = 10, search = '' } = req.query;

    // Build query for customers from database
    let query = knex('customers')
      .where('tenant_id', tenantId)
      .where('money_loan_approved', true); // Only show customers approved for Money Loan product

    // Apply search filter if provided
    if (search) {
      query = query.where(function() {
        this.where('first_name', 'ilike', `%${search}%`)
          .orWhere('last_name', 'ilike', `%${search}%`)
          .orWhere('email', 'ilike', `%${search}%`)
          .orWhere('customer_code', 'ilike', `%${search}%`)
          .orWhere('phone', 'ilike', `%${search}%`);
      });
    }

    // Get total count for pagination
    const countQuery = query.clone().count('id as count').first();
    const { count } = await countQuery;
    const total = parseInt(count);

    // Get paginated customers
    const customers = await query
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * parseInt(limit));

    // Transform snake_case to camelCase for frontend
    const transformedCustomers = customers.map(customer => ({
      id: customer.id,
      customerCode: customer.customer_code,
      firstName: customer.first_name,
      lastName: customer.last_name,
      fullName: `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      kycStatus: customer.kyc_status,
      creditScore: customer.credit_score,
      activeLoans: 0, // TODO: Calculate from loans table
      monthlyIncome: customer.monthly_income,
      riskLevel: customer.risk_level,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    }));

    res.json({
      success: true,
      message: 'Customers fetched successfully',
      data: transformedCustomers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch customers' 
    });
  }
});

/**
 * @route POST /api/money-loan/customers
 * @desc Create a new customer
 * @access Private
 */
router.post('/customers', authMiddleware, rbacMiddleware(['money-loan'], ['customers:create']), async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    console.log('🔍 POST /customers - Creating customer for tenant:', tenantId);

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Generate customer code
    const tenant = await knex('tenants').where('id', tenantId).first();
    const tenantPrefix = tenant?.subdomain?.toUpperCase() || 'CUST';
    
    const customerCount = await knex('customers')
      .where('tenant_id', tenantId)
      .count('id as count')
      .first();
    
    const nextNumber = (parseInt(customerCount?.count || 0) + 1).toString().padStart(4, '0');
    const customerCode = `CUST-${tenantPrefix}-${nextNumber}`;
    
    // Map camelCase to snake_case for database
    const customerData = {
      tenant_id: tenantId,
      customer_code: customerCode,
      first_name: req.body.firstName,
      middle_name: req.body.middleName,
      last_name: req.body.lastName,
      date_of_birth: req.body.dateOfBirth,
      gender: req.body.gender,
      nationality: req.body.nationality,
      civil_status: req.body.civilStatus,
      email: req.body.email,
      phone: req.body.phone,
      alternate_phone: req.body.alternatePhone,
      employment_status: req.body.employmentStatus,
      employer_name: req.body.employerName,
      employer_address: req.body.employerAddress,
      employer_phone: req.body.employerPhone,
      occupation: req.body.occupation,
      monthly_income: req.body.monthlyIncome,
      source_of_income: req.body.sourceOfIncome,
      years_employed: req.body.yearsEmployed,
      id_type: req.body.idType,
      id_number: req.body.idNumber,
      id_expiry_date: req.body.idExpiryDate,
      tin_number: req.body.tinNumber,
      sss_number: req.body.sssNumber,
      kyc_status: req.body.kycStatus || 'pending',
      credit_score: req.body.creditScore || 650,
      risk_level: req.body.riskLevel || 'medium',
      status: req.body.status || 'active',
      money_loan_approved: true // Auto-approve for Money Loan product
    };

    // Insert customer
    const [newCustomer] = await knex('customers')
      .insert(customerData)
      .returning('*');

    // Fetch customer with tenant name
    const customerWithTenant = await knex('customers')
      .leftJoin('tenants', 'customers.tenant_id', 'tenants.id')
      .select(
        'customers.*',
        'tenants.name as tenant_name'
      )
      .where('customers.id', newCustomer.id)
      .first();

    // Transform to camelCase
    const transformedCustomer = {
      id: customerWithTenant.id,
      tenantId: customerWithTenant.tenant_id,
      tenantName: customerWithTenant.tenant_name,
      customerCode: customerWithTenant.customer_code,
      firstName: customerWithTenant.first_name,
      middleName: customerWithTenant.middle_name,
      lastName: customerWithTenant.last_name,
      fullName: `${customerWithTenant.first_name} ${customerWithTenant.last_name}`,
      email: customerWithTenant.email,
      phone: customerWithTenant.phone,
      alternatePhone: customerWithTenant.alternate_phone,
      dateOfBirth: customerWithTenant.date_of_birth,
      gender: customerWithTenant.gender,
      nationality: customerWithTenant.nationality,
      civilStatus: customerWithTenant.civil_status,
      status: customerWithTenant.status,
      kycStatus: customerWithTenant.kyc_status,
      creditScore: customerWithTenant.credit_score,
      monthlyIncome: customerWithTenant.monthly_income,
      riskLevel: customerWithTenant.risk_level,
      employmentStatus: customerWithTenant.employment_status,
      employerName: customerWithTenant.employer_name,
      employerAddress: customerWithTenant.employer_address,
      employerPhone: customerWithTenant.employer_phone,
      occupation: customerWithTenant.occupation,
      sourceOfIncome: customerWithTenant.source_of_income,
      yearsEmployed: customerWithTenant.years_employed,
      idType: customerWithTenant.id_type,
      idNumber: customerWithTenant.id_number,
      idExpiryDate: customerWithTenant.id_expiry_date,
      tinNumber: customerWithTenant.tin_number,
      sssNumber: customerWithTenant.sss_number,
      createdAt: customerWithTenant.created_at,
      updatedAt: customerWithTenant.updated_at
    };

    console.log('✅ Customer created:', transformedCustomer.customerCode);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: transformedCustomer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message
    });
  }
});

/**
 * @route GET /api/money-loan/customers/:id
 * @desc Get a single customer by ID
 * @access Private
 */
router.get('/customers/:id', authMiddleware, rbacMiddleware(['money-loan'], ['customers:read']), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    console.log('🔍 GET /customers/:id - ID:', id, 'Tenant:', tenantId);

    // Get customer from database with tenant name
    const customer = await knex('customers')
      .leftJoin('tenants', 'customers.tenant_id', 'tenants.id')
      .select(
        'customers.*',
        'tenants.name as tenant_name',
        'tenants.subdomain as tenant_subdomain'
      )
      .where({ 
        'customers.id': parseInt(id), 
        'customers.tenant_id': tenantId,
        'customers.money_loan_approved': true 
      })
      .first();

    if (!customer) {
      console.log('🔍 Customer not found or not approved for Money Loan');
      return res.status(404).json({
        success: false,
        message: 'Customer not found or not approved for Money Loan product'
      });
    }

    console.log('🔍 Customer found:', customer.customer_code);

    // Transform snake_case to camelCase for frontend
    const transformedCustomer = {
      id: customer.id,
      tenantId: customer.tenant_id,
      tenantName: customer.tenant_name, // Include tenant name
      customerCode: customer.customer_code,
      firstName: customer.first_name,
      middleName: customer.middle_name,
      lastName: customer.last_name,
      fullName: `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
      phone: customer.phone,
      alternatePhone: customer.alternate_phone,
      dateOfBirth: customer.date_of_birth,
      gender: customer.gender,
      nationality: customer.nationality,
      civilStatus: customer.civil_status,
      status: customer.status,
      kycStatus: customer.kyc_status,
      creditScore: customer.credit_score,
      activeLoans: 0, // TODO: Calculate from loans table
      monthlyIncome: customer.monthly_income,
      riskLevel: customer.risk_level,
      // Employment
      employmentStatus: customer.employment_status,
      employerName: customer.employer_name,
      employerAddress: customer.employer_address,
      employerPhone: customer.employer_phone,
      occupation: customer.occupation,
      sourceOfIncome: customer.source_of_income,
      yearsEmployed: customer.years_employed,
      // KYC
      idType: customer.id_type,
      idNumber: customer.id_number,
      idExpiryDate: customer.id_expiry_date,
      tinNumber: customer.tin_number,
      sssNumber: customer.sss_number,
      // Note: Address data should be fetched from addresses table with polymorphic relationship
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    };

    res.json({
      success: true,
      data: transformedCustomer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch customer' 
    });
  }
});

/**
 * @route PUT /api/money-loan/customers/:id
 * @desc Update a customer
 * @access Private
 */
router.put('/customers/:id', authMiddleware, rbacMiddleware(['money-loan'], ['customers:update']), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    console.log('🔍 PUT /customers/:id - ID:', id, 'Tenant:', tenantId);

    // Check if customer exists and belongs to this tenant
    const existingCustomer = await knex('customers')
      .where({ 
        id: parseInt(id), 
        tenant_id: tenantId,
        money_loan_approved: true 
      })
      .first();

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or not approved for Money Loan product'
      });
    }

    // Validate email format if provided
    if (req.body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
    }

    // Map camelCase to snake_case for database (only provided fields)
    const updateData = {};
    if (req.body.firstName !== undefined) updateData.first_name = req.body.firstName;
    if (req.body.middleName !== undefined) updateData.middle_name = req.body.middleName;
    if (req.body.lastName !== undefined) updateData.last_name = req.body.lastName;
    if (req.body.dateOfBirth !== undefined) updateData.date_of_birth = req.body.dateOfBirth;
    if (req.body.gender !== undefined) updateData.gender = req.body.gender;
    if (req.body.nationality !== undefined) updateData.nationality = req.body.nationality;
    if (req.body.civilStatus !== undefined) updateData.civil_status = req.body.civilStatus;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.alternatePhone !== undefined) updateData.alternate_phone = req.body.alternatePhone;
    if (req.body.employmentStatus !== undefined) updateData.employment_status = req.body.employmentStatus;
    if (req.body.employerName !== undefined) updateData.employer_name = req.body.employerName;
    if (req.body.employerAddress !== undefined) updateData.employer_address = req.body.employerAddress;
    if (req.body.employerPhone !== undefined) updateData.employer_phone = req.body.employerPhone;
    if (req.body.occupation !== undefined) updateData.occupation = req.body.occupation;
    if (req.body.monthlyIncome !== undefined) updateData.monthly_income = req.body.monthlyIncome;
    if (req.body.sourceOfIncome !== undefined) updateData.source_of_income = req.body.sourceOfIncome;
    if (req.body.yearsEmployed !== undefined) updateData.years_employed = req.body.yearsEmployed;
    if (req.body.idType !== undefined) updateData.id_type = req.body.idType;
    if (req.body.idNumber !== undefined) updateData.id_number = req.body.idNumber;
    if (req.body.idExpiryDate !== undefined) updateData.id_expiry_date = req.body.idExpiryDate;
    if (req.body.tinNumber !== undefined) updateData.tin_number = req.body.tinNumber;
    if (req.body.sssNumber !== undefined) updateData.sss_number = req.body.sssNumber;
    if (req.body.kycStatus !== undefined) updateData.kyc_status = req.body.kycStatus;
    if (req.body.creditScore !== undefined) updateData.credit_score = req.body.creditScore;
    if (req.body.riskLevel !== undefined) updateData.risk_level = req.body.riskLevel;
    if (req.body.status !== undefined) updateData.status = req.body.status;

    // Update the customer
    await knex('customers')
      .where({ id: parseInt(id), tenant_id: tenantId })
      .update({
        ...updateData,
        updated_at: knex.fn.now()
      });

    // Fetch updated customer with tenant name
    const updatedCustomer = await knex('customers')
      .leftJoin('tenants', 'customers.tenant_id', 'tenants.id')
      .select(
        'customers.*',
        'tenants.name as tenant_name'
      )
      .where('customers.id', parseInt(id))
      .first();

    // Transform to camelCase
    const transformedCustomer = {
      id: updatedCustomer.id,
      tenantId: updatedCustomer.tenant_id,
      tenantName: updatedCustomer.tenant_name,
      customerCode: updatedCustomer.customer_code,
      firstName: updatedCustomer.first_name,
      middleName: updatedCustomer.middle_name,
      lastName: updatedCustomer.last_name,
      fullName: `${updatedCustomer.first_name} ${updatedCustomer.last_name}`,
      email: updatedCustomer.email,
      phone: updatedCustomer.phone,
      alternatePhone: updatedCustomer.alternate_phone,
      dateOfBirth: updatedCustomer.date_of_birth,
      gender: updatedCustomer.gender,
      nationality: updatedCustomer.nationality,
      civilStatus: updatedCustomer.civil_status,
      status: updatedCustomer.status,
      kycStatus: updatedCustomer.kyc_status,
      creditScore: updatedCustomer.credit_score,
      monthlyIncome: updatedCustomer.monthly_income,
      riskLevel: updatedCustomer.risk_level,
      employmentStatus: updatedCustomer.employment_status,
      employerName: updatedCustomer.employer_name,
      employerAddress: updatedCustomer.employer_address,
      employerPhone: updatedCustomer.employer_phone,
      occupation: updatedCustomer.occupation,
      sourceOfIncome: updatedCustomer.source_of_income,
      yearsEmployed: updatedCustomer.years_employed,
      idType: updatedCustomer.id_type,
      idNumber: updatedCustomer.id_number,
      idExpiryDate: updatedCustomer.id_expiry_date,
      tinNumber: updatedCustomer.tin_number,
      sssNumber: updatedCustomer.sss_number,
      createdAt: updatedCustomer.created_at,
      updatedAt: updatedCustomer.updated_at
    };

    console.log('✅ Customer updated:', transformedCustomer.customer_code);

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: transformedCustomer
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
});

/**
 * @route GET /api/money-loan/loans
 * @desc Get loans list
 * @access Private
 */
router.get('/loans', authMiddleware, rbacMiddleware(['money-loan'], ['loans:read']), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { page = 1, limit = 10, status = '', search = '' } = req.query;

    // Mock data for now - replace with actual database queries
    const loans = {
      data: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    };

    res.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

/**
 * @route GET /api/money-loan/payments
 * @desc Get payments list
 * @access Private
 */
router.get('/payments', authMiddleware, rbacMiddleware(['money-loan'], ['payments:read']), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { page = 1, limit = 10 } = req.query;

    // Mock data for now - replace with actual database queries
    const payments = {
      data: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    };

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

/**
 * @route GET /api/money-loan/collections
 * @desc Get collections list
 * @access Private
 */
router.get('/collections', authMiddleware, rbacMiddleware(['money-loan'], ['collections:read']), async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { page = 1, limit = 10 } = req.query;

    // Mock data for now - replace with actual database queries
    const collections = {
      data: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    };

    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

/**
 * @route GET /api/money-loan/reports
 * @desc Get reports data
 * @access Private
 */
router.get('/reports', authMiddleware, rbacMiddleware(['money-loan'], ['reports:read']), async (req, res) => {
  try {
    const { tenantId } = req.user;

    // Mock data for now - replace with actual database queries
    const reports = {
      summary: {},
      charts: []
    };

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

module.exports = router;
