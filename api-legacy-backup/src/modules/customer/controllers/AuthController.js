/**
 * Customer Authentication Controller
 * Handles login for Money Loan customers
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const knex = require('../../../config/knex');

class CustomerAuthController {
  /**
   * Customer Login
   * Authenticates customer using email/phone and password
   */
  async login(req, res) {
    try {
      const { identifier, password, rememberMe } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email/phone and password are required'
        });
      }

      // Find customer by email or phone
      const customer = await knex('customers')
        .select(
          'customers.*',
          'users.email as user_email',
          'users.password_hash',
          'users.id as user_id',
          'money_loan_customer_profiles.kyc_status',
          'money_loan_customer_profiles.credit_score',
          'money_loan_customer_profiles.risk_level',
          'tenants.name as tenant_name',
          'tenants.subdomain as tenant_subdomain'
        )
        .leftJoin('users', 'customers.user_id', 'users.id')
        .leftJoin('money_loan_customer_profiles', 'customers.id', 'money_loan_customer_profiles.customer_id')
        .leftJoin('tenants', 'customers.tenant_id', 'tenants.id')
        .where(function() {
          this.where('customers.email', identifier)
            .orWhere('customers.phone', identifier);
        })
        .whereNotNull('customers.user_id') // Must have portal access
        .where('customers.status', 'active')
        .first();

      if (!customer) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials or account not found'
        });
      }

      // Verify password exists and is correct
      if (!customer.passwordHash) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const isValidPassword = await bcrypt.compare(password, customer.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate tokens
      const tokenExpiry = rememberMe ? '30d' : '1d';
      const accessToken = jwt.sign(
        { 
          userId: customer.user_id,
          customerId: customer.id,
          tenantId: customer.tenant_id,
          type: 'customer'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: tokenExpiry }
      );

      const refreshToken = jwt.sign(
        { 
          userId: customer.user_id,
          customerId: customer.id,
          type: 'customer'
        },
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
        { expiresIn: '90d' }
      );

      // Transform to camelCase for frontend (Knex already converts, but we need to select specific fields)
      const customerData = {
        id: customer.id,
        customerId: customer.id,
        userId: customer.userId || customer.user_id,
        tenantId: customer.tenantId || customer.tenant_id,
        tenantName: customer.tenantName || customer.tenant_name || 'Company Name',
        tenantSubdomain: customer.tenantSubdomain || customer.tenant_subdomain,
        customerCode: customer.customerCode || customer.customer_code,
        firstName: customer.firstName || customer.first_name,
        lastName: customer.lastName || customer.last_name,
        middleName: customer.middleName || customer.middle_name,
        email: customer.email,
        phone: customer.phone,
        kycStatus: customer.kycStatus || customer.kyc_status,
        creditScore: customer.creditScore || customer.credit_score,
        riskLevel: customer.riskLevel || customer.risk_level
      };

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          customer: customerData,
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });

    } catch (error) {
      console.error('Customer login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.'
      });
    }
  }

  /**
   * Get current customer profile
   */
  async getProfile(req, res) {
    try {
      const customerId = req.customer.customerId; // From auth middleware

      const customer = await knex('customers')
        .select(
          'customers.*',
          'money_loan_customer_profiles.kyc_status',
          'money_loan_customer_profiles.credit_score',
          'money_loan_customer_profiles.risk_level'
        )
        .leftJoin('money_loan_customer_profiles', 'customers.id', 'money_loan_customer_profiles.customer_id')
        .where('customers.id', customerId)
        .first();

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      // Transform to camelCase
      const customerData = {
        id: customer.id,
        tenantId: customer.tenant_id,
        customerCode: customer.customer_code,
        customerType: customer.customer_type,
        firstName: customer.first_name,
        lastName: customer.last_name,
        middleName: customer.middle_name,
        email: customer.email,
        phone: customer.phone,
        alternatePhone: customer.alternate_phone,
        // Note: Address information now in separate addresses table
        kycStatus: customer.kyc_status,
        creditScore: customer.credit_score,
        riskLevel: customer.risk_level,
        status: customer.status
      };

      return res.json({
        success: true,
        data: customerData
      });

    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch profile'
      });
    }
  }

  /**
   * Customer Logout
   */
  async logout(req, res) {
    // In a production system, you'd invalidate the token here
    // For now, just return success as the frontend will remove the token
    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}

module.exports = new CustomerAuthController();
