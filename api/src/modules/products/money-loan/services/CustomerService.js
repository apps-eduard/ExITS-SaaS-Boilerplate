const pool = require('../../../../config/database');
const logger = require('../../../../utils/logger');

class CustomerService {
  /**
   * Transform database row to camelCase
   */
  static transformCustomer(dbCustomer) {
    if (!dbCustomer) return null;

    return {
      id: dbCustomer.id,
      tenantId: dbCustomer.tenant_id,
      customerCode: dbCustomer.customer_code,
      firstName: dbCustomer.first_name,
      middleName: dbCustomer.middle_name,
      lastName: dbCustomer.last_name,
      fullName: `${dbCustomer.first_name} ${dbCustomer.middle_name || ''} ${dbCustomer.last_name}`.trim(),
      dateOfBirth: dbCustomer.date_of_birth,
      gender: dbCustomer.gender,
      email: dbCustomer.email,
      phone: dbCustomer.phone,
      address: dbCustomer.address,
      city: dbCustomer.city,
      state: dbCustomer.state,
      zipCode: dbCustomer.zip_code,
      country: dbCustomer.country,
      idType: dbCustomer.id_type,
      idNumber: dbCustomer.id_number,
      employmentStatus: dbCustomer.employment_status,
      employerName: dbCustomer.employer_name,
      monthlyIncome: parseFloat(dbCustomer.monthly_income) || 0,
      creditScore: dbCustomer.credit_score,
      riskLevel: dbCustomer.risk_level,
      status: dbCustomer.status,
      kycStatus: dbCustomer.kyc_status,
      kycVerifiedAt: dbCustomer.kyc_verified_at,
      kycNotes: dbCustomer.kyc_notes,
      metadata: dbCustomer.metadata,
      createdAt: dbCustomer.created_at,
      updatedAt: dbCustomer.updated_at
    };
  }

  /**
   * Generate unique customer code
   */
  static async generateCustomerCode(tenantId) {
    const prefix = 'CUS';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${tenantId}-${timestamp}${random}`;
  }

  /**
   * Create new customer
   */
  static async createCustomer(tenantId, customerData) {
    try {
      const customerCode = await this.generateCustomerCode(tenantId);

      const result = await pool.query(
        `INSERT INTO loan_customers (
          tenant_id, customer_code, first_name, middle_name, last_name,
          date_of_birth, gender, email, phone, address, city, state, zip_code, country,
          id_type, id_number, employment_status, employer_name, monthly_income,
          credit_score, risk_level, status, kyc_status, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        RETURNING *`,
        [
          tenantId,
          customerCode,
          customerData.firstName,
          customerData.middleName || null,
          customerData.lastName,
          customerData.dateOfBirth || null,
          customerData.gender || null,
          customerData.email || null,
          customerData.phone,
          customerData.address || null,
          customerData.city || null,
          customerData.state || null,
          customerData.zipCode || null,
          customerData.country || 'Philippines',
          customerData.idType || null,
          customerData.idNumber || null,
          customerData.employmentStatus || null,
          customerData.employerName || null,
          customerData.monthlyIncome || 0,
          customerData.creditScore || 0,
          customerData.riskLevel || 'medium',
          'active',
          'pending',
          customerData.metadata || {}
        ]
      );

      logger.info(`Customer created: ${customerCode}`);
      return this.transformCustomer(result.rows[0]);
    } catch (err) {
      logger.error(`Error creating customer: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get customer by ID
   */
  static async getCustomerById(tenantId, customerId) {
    try {
      const result = await pool.query(
        `SELECT * FROM loan_customers WHERE tenant_id = $1 AND id = $2`,
        [tenantId, customerId]
      );

      return this.transformCustomer(result.rows[0]);
    } catch (err) {
      logger.error(`Error getting customer: ${err.message}`);
      throw err;
    }
  }

  /**
   * List customers with filters and pagination
   */
  static async listCustomers(tenantId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        kycStatus,
        riskLevel,
        search
      } = filters;

      const offset = (page - 1) * limit;
      let whereConditions = ['tenant_id = $1'];
      let params = [tenantId];
      let paramCount = 2;

      if (status) {
        whereConditions.push(`status = $${paramCount++}`);
        params.push(status);
      }

      if (kycStatus) {
        whereConditions.push(`kyc_status = $${paramCount++}`);
        params.push(kycStatus);
      }

      if (riskLevel) {
        whereConditions.push(`risk_level = $${paramCount++}`);
        params.push(riskLevel);
      }

      if (search) {
        whereConditions.push(`(
          first_name ILIKE $${paramCount} OR 
          last_name ILIKE $${paramCount} OR 
          customer_code ILIKE $${paramCount} OR
          email ILIKE $${paramCount} OR
          phone ILIKE $${paramCount}
        )`);
        params.push(`%${search}%`);
        paramCount++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM loan_customers WHERE ${whereClause}`,
        params
      );

      // Get paginated data
      const dataQuery = `
        SELECT * FROM loan_customers
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;
      params.push(limit, offset);

      const dataResult = await pool.query(dataQuery, params);

      return {
        customers: dataResult.rows.map(row => this.transformCustomer(row)),
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
        }
      };
    } catch (err) {
      logger.error(`Error listing customers: ${err.message}`);
      throw err;
    }
  }

  /**
   * Update customer
   */
  static async updateCustomer(tenantId, customerId, updateData) {
    try {
      const fieldsToUpdate = [];
      const values = [];
      let paramCount = 1;

      const fieldMapping = {
        firstName: 'first_name',
        middleName: 'middle_name',
        lastName: 'last_name',
        dateOfBirth: 'date_of_birth',
        gender: 'gender',
        email: 'email',
        phone: 'phone',
        address: 'address',
        city: 'city',
        state: 'state',
        zipCode: 'zip_code',
        country: 'country',
        idType: 'id_type',
        idNumber: 'id_number',
        employmentStatus: 'employment_status',
        employerName: 'employer_name',
        monthlyIncome: 'monthly_income',
        creditScore: 'credit_score',
        riskLevel: 'risk_level',
        status: 'status',
        kycStatus: 'kyc_status',
        kycNotes: 'kyc_notes',
        metadata: 'metadata'
      };

      Object.keys(updateData).forEach(key => {
        if (fieldMapping[key] && updateData[key] !== undefined) {
          fieldsToUpdate.push(`${fieldMapping[key]} = $${paramCount++}`);
          values.push(updateData[key]);
        }
      });

      if (fieldsToUpdate.length === 0) {
        throw new Error('No fields to update');
      }

      fieldsToUpdate.push('updated_at = NOW()');
      values.push(tenantId, customerId);

      const query = `
        UPDATE loan_customers 
        SET ${fieldsToUpdate.join(', ')}
        WHERE tenant_id = $${paramCount++} AND id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Customer not found');
      }

      logger.info(`Customer updated: ${customerId}`);
      return this.transformCustomer(result.rows[0]);
    } catch (err) {
      logger.error(`Error updating customer: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get customer statistics
   */
  static async getCustomerStats(tenantId, customerId) {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(DISTINCT l.id) as total_loans,
          COUNT(DISTINCT CASE WHEN l.status = 'active' THEN l.id END) as active_loans,
          COUNT(DISTINCT CASE WHEN l.status = 'overdue' THEN l.id END) as overdue_loans,
          COUNT(DISTINCT CASE WHEN l.status = 'paid_off' THEN l.id END) as paid_off_loans,
          COALESCE(SUM(CASE WHEN l.status IN ('active', 'overdue') THEN l.outstanding_balance ELSE 0 END), 0) as total_outstanding,
          COALESCE(SUM(l.amount_paid), 0) as total_paid
        FROM loans l
        WHERE l.tenant_id = $1 AND l.customer_id = $2`,
        [tenantId, customerId]
      );

      const stats = result.rows[0];

      return {
        totalLoans: parseInt(stats.total_loans) || 0,
        activeLoans: parseInt(stats.active_loans) || 0,
        overdueLoans: parseInt(stats.overdue_loans) || 0,
        paidOffLoans: parseInt(stats.paid_off_loans) || 0,
        totalOutstanding: parseFloat(stats.total_outstanding) || 0,
        totalPaid: parseFloat(stats.total_paid) || 0
      };
    } catch (err) {
      logger.error(`Error getting customer stats: ${err.message}`);
      throw err;
    }
  }
}

module.exports = CustomerService;
