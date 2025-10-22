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
      plan: Joi.string().valid('basic', 'pro', 'enterprise').required(),
      billing_email: Joi.string().email().optional(),
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
