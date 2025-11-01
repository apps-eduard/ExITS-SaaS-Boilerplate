// src/utils/validators.js
const Joi = require('joi');

class Validators {
  static validateLogin(data) {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
    });
    return schema.validate(data);
  }

  static validateCreateUser(data) {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      // Support both camelCase and snake_case
      firstName: Joi.string().optional(),
      first_name: Joi.string().optional(),
      lastName: Joi.string().optional(),
      last_name: Joi.string().optional(),
      // Make role_id optional since roles are assigned separately
      role_id: Joi.number().optional(),
      roleId: Joi.number().optional(),
      // Optional tenant_id for system users
      tenantId: Joi.number().allow(null).optional(),
      tenant_id: Joi.number().allow(null).optional(),
      status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
    }).or('firstName', 'first_name') // At least one first name required
      .or('lastName', 'last_name');   // At least one last name required
    return schema.validate(data);
  }

  static validateCreateRole(data) {
    const schema = Joi.object({
      name: Joi.string().required(),
      description: Joi.string().optional(),
      space: Joi.string().valid('system', 'tenant').required(),
    });
    return schema.validate(data);
  }

  static validateCreateTenant(data) {
    const schema = Joi.object({
      name: Joi.string().required(),
      subdomain: Joi.string().required(),
      plan: Joi.string().optional(), // Allow any plan name (validated against DB)
      subscriptionPlan: Joi.string().optional(), // Allow any plan name (validated against DB)
      planId: Joi.number().optional(),
      billingCycle: Joi.string().valid('monthly', 'yearly').optional(),
      status: Joi.string().valid('active', 'suspended', 'deleted').optional(),
      industry: Joi.string().optional(),
      billing_email: Joi.string().email().optional(),
      maxUsers: Joi.number().optional(),
      logoUrl: Joi.string().uri().optional(),
      primaryColor: Joi.string().optional(),
      secondaryColor: Joi.string().optional(),
      // Contact info
      contactFirstName: Joi.string().optional(),
      contactLastName: Joi.string().optional(),
      contactEmail: Joi.string().email().optional(),
      contactPhone: Joi.string().optional(),
      // Address
      street_address: Joi.string().allow('').optional(),
      barangay: Joi.string().allow('').optional(),
      city: Joi.string().allow('').optional(),
      province: Joi.string().allow('').optional(),
      region: Joi.string().allow('').optional(),
      postal_code: Joi.string().allow('').optional(),
      country: Joi.string().optional(),
      // Feature flags
      money_loan_enabled: Joi.boolean().optional(),
      bnpl_enabled: Joi.boolean().optional(),
      pawnshop_enabled: Joi.boolean().optional(),
      // Admin user
      adminFirstName: Joi.string().when('adminEmail', { is: Joi.exist(), then: Joi.required() }),
      adminLastName: Joi.string().when('adminEmail', { is: Joi.exist(), then: Joi.required() }),
      adminEmail: Joi.string().email().optional(),
      adminPassword: Joi.string().min(8).when('adminEmail', { is: Joi.exist(), then: Joi.required() })
    });
    return schema.validate(data);
  }

  static validatePagination(page, limit) {
    const MAX_LIMIT = 100;
    const DEFAULT_LIMIT = 20;
    const DEFAULT_PAGE = 1;

    let parsedPage = parseInt(page, 10) || DEFAULT_PAGE;
    let parsedLimit = parseInt(limit, 10) || DEFAULT_LIMIT;

    // Validate ranges
    if (parsedPage < 1) parsedPage = DEFAULT_PAGE;
    if (parsedLimit < 1) parsedLimit = DEFAULT_LIMIT;
    if (parsedLimit > MAX_LIMIT) parsedLimit = MAX_LIMIT;

    return { page: parsedPage, limit: parsedLimit };
  }
}

module.exports = Validators;
