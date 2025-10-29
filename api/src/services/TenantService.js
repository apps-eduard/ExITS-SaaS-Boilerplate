/**
 * Tenant Service
 * Handles tenant management and multi-tenancy operations
 */

const knex = require('../config/knex');
const logger = require('../utils/logger');

class TenantService {
  /**
   * Transform database tenant object to camelCase
   */
  static transformTenant(dbTenant) {
    if (!dbTenant) return null;
    return {
      id: dbTenant.id,
      name: dbTenant.name,
      subdomain: dbTenant.subdomain,
      plan: dbTenant.plan,
      status: dbTenant.status,
      maxUsers: dbTenant.max_users,
      logoUrl: dbTenant.logo_url,
      primaryColor: dbTenant.primary_color,
      secondaryColor: dbTenant.secondary_color,
      // Contact information
      contactPerson: dbTenant.contact_person,
      contactEmail: dbTenant.contact_email,
      contactPhone: dbTenant.contact_phone,
      // Product enablement
      moneyLoanEnabled: dbTenant.money_loan_enabled,
      bnplEnabled: dbTenant.bnpl_enabled,
      pawnshopEnabled: dbTenant.pawnshop_enabled,
      createdAt: dbTenant.created_at,
      updatedAt: dbTenant.updated_at,
      // Include counts if present
      userCount: dbTenant.user_count,
      roleCount: dbTenant.role_count,
    };
  }

  /**
   * Create a new tenant with admin user
   */
  static async createTenant(tenantData, _requestingUserId) {
    try {
      return await knex.transaction(async (trx) => {
        // Check if subdomain is already taken
        const existingTenant = await trx('tenants')
          .select('id')
          .where({ subdomain: tenantData.subdomain })
          .first();

        if (existingTenant) {
          throw new Error('Subdomain already taken');
        }

        // Check if admin email already exists
        if (tenantData.adminEmail) {
          const existingUser = await trx('users')
            .select('id')
            .whereRaw('LOWER(email) = LOWER(?)', [tenantData.adminEmail])
            .first();

          if (existingUser) {
            throw new Error('Admin email already registered');
          }
        }

        // Validate and get plan name (handle both 'plan' and 'subscriptionPlan' fields)
        const requestedPlan = tenantData.plan || tenantData.subscriptionPlan || 'starter';
        
        // Validate plan exists in database (case-insensitive match)
        const planCheck = await trx('subscriptionPlans')
          .select('name')
          .whereRaw('LOWER(name) = LOWER(?)', [requestedPlan])
          .where({ status: 'active' })
          .first();

        if (!planCheck) {
          throw new Error(`Invalid subscription plan: ${requestedPlan}. Plan does not exist or is inactive.`);
        }

        // Use the plan name directly from database (should match tenant_plan ENUM)
        const plan = planCheck.name;

        const [tenant] = await trx('tenants')
          .insert({
            name: tenantData.name,
            subdomain: tenantData.subdomain,
            plan,
            status: tenantData.status || 'active',
            maxUsers: tenantData.maxUsers || 10,
            logoUrl: tenantData.logoUrl || null,
            primaryColor: tenantData.primaryColor || null,
            secondaryColor: tenantData.secondaryColor || null,
            moneyLoanEnabled: tenantData.money_loan_enabled || false,
            bnplEnabled: tenantData.bnpl_enabled || false,
            pawnshopEnabled: tenantData.pawnshop_enabled || false,
          })
          .returning(['id', 'name', 'subdomain', 'plan', 'status', 'maxUsers', 'createdAt']);

        // Create tenant subscription record
        const planResult = await trx('subscriptionPlans')
          .select('id', 'price')
          .whereRaw('LOWER(name) = LOWER(?)', [plan])
          .where({ status: 'active' })
          .first();

        if (planResult) {
          const planId = planResult.id;
          const monthlyPrice = planResult.price;
          
          // Calculate expiration date (1 year from now)
          const startDate = new Date();
          const expirationDate = new Date(startDate);
          expirationDate.setFullYear(expirationDate.getFullYear() + 1);

          await trx('tenantSubscriptions').insert({
            tenantId: tenant.id,
            planId,
            status: 'active',
            startedAt: startDate,
            expiresAt: expirationDate,
            monthlyPrice,
          });

          logger.info(`Tenant subscription created: Tenant ${tenant.id} -> Plan ${planId}`);
        }

        // Create default tenant roles
        const defaultRoles = [
          { name: 'Tenant Admin', description: 'Tenant administrator', space: 'tenant' },
          { name: 'User Manager', description: 'Manage tenant users', space: 'tenant' },
          { name: 'Analyst', description: 'Data analyst access', space: 'tenant' },
          { name: 'Viewer', description: 'Read-only access', space: 'tenant' },
        ];

        let tenantAdminRoleId = null;
        for (const role of defaultRoles) {
          const [createdRole] = await trx('roles')
            .insert({
              tenantId: tenant.id,
              name: role.name,
              description: role.description,
              space: role.space,
            })
            .returning(['id']);
          
          // Save the Tenant Admin role ID for assigning to the admin user
          if (role.name === 'Tenant Admin') {
            tenantAdminRoleId = createdRole.id;
            
            // Grant all tenant-level permissions to Tenant Admin role
            const permissions = await trx('permissions')
              .select('id')
              .whereIn('space', ['tenant', 'both']);
            
            if (permissions.length > 0) {
              const permissionInserts = permissions.map(p => ({
                roleId: tenantAdminRoleId,
                permissionId: p.id,
              }));
              
              await trx('rolePermissions')
                .insert(permissionInserts)
                .onConflict(['roleId', 'permissionId'])
                .ignore();
              
              logger.info(`Granted ${permissions.length} permissions to Tenant Admin role`);
            }
          }
        }

        // Create admin user if admin details provided
        if (tenantData.adminEmail && tenantData.adminPassword) {
          const bcrypt = require('bcrypt');
          const hashedPassword = await bcrypt.hash(tenantData.adminPassword, 10);

          const [adminUser] = await trx('users')
            .insert({
              email: tenantData.adminEmail,
              passwordHash: hashedPassword,
              firstName: tenantData.adminFirstName || '',
              lastName: tenantData.adminLastName || '',
              tenantId: tenant.id,
              status: 'active',
            })
            .returning(['id', 'email', 'firstName', 'lastName']);

          // Assign Tenant Admin role to the admin user
          if (tenantAdminRoleId) {
            await trx('userRoles').insert({
              userId: adminUser.id,
              roleId: tenantAdminRoleId,
            });
          }

          logger.info(`Tenant admin user created: ${adminUser.email} for tenant ${tenant.name}`);
        }

        logger.info(`Tenant created: ${tenant.name} (${tenant.id})`);
        return tenant;
      });
    } catch (err) {
      logger.error(`Tenant service create error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get tenant by ID
   */
  static async getTenantById(tenantId) {
    try {
      const tenant = await knex('tenants as t')
        .leftJoin('subscriptionPlans as sp', function() {
          this.on(knex.raw('LOWER(sp.name) = LOWER(t.plan::text)'))
            .andOn('sp.status', knex.raw('?', ['active']));
        })
        .select(
          't.id',
          't.name',
          't.subdomain',
          't.plan',
          't.status',
          't.max_users',
          't.logo_url',
          't.primary_color',
          't.secondary_color',
          't.contact_person',
          't.contact_email',
          't.contact_phone',
          't.money_loan_enabled',
          't.bnpl_enabled',
          't.pawnshop_enabled',
          't.created_at',
          't.updated_at',
          'sp.id as planId',
          'sp.name as planName',
          'sp.description as planDescription',
          'sp.price',
          'sp.billingCycle',
          'sp.features',
          'sp.maxUsers as planMaxUsers',
          'sp.maxStorageGb'
        )
        .where('t.id', tenantId)
        .first();

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Get tenant stats
      const usersCount = await knex('users')
        .where({ tenantId })
        .count('* as count')
        .first();

      const rolesCount = await knex('roles')
        .where({ tenantId })
        .count('* as count')
        .first();

      // Add counts to tenant object
      tenant.userCount = parseInt(usersCount.count);
      tenant.roleCount = parseInt(rolesCount.count);

      // Use transformTenant to get camelCase response
      const transformedTenant = this.transformTenant(tenant);

      // Add subscription plan details if available
      if (tenant.planId) {
        transformedTenant.subscriptionPlan = {
          id: tenant.planId,
          name: tenant.planName,
          description: tenant.planDescription,
          price: parseFloat(tenant.price),
          billingCycle: tenant.billingCycle,
          features: tenant.features,
          maxUsers: tenant.planMaxUsers,
          maxStorageGb: tenant.maxStorageGb
        };
      }

      return transformedTenant;
    } catch (err) {
      logger.error(`Tenant service get by ID error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get tenant by subdomain
   */
  static async getTenantBySubdomain(subdomain) {
    try {
      const tenant = await knex('tenants')
        .select('id', 'name', 'subdomain', 'plan', 'status', 'maxUsers', 'createdAt')
        .where({ subdomain, status: 'active' })
        .first();

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      return tenant;
    } catch (err) {
      logger.error(`Tenant service get by subdomain error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get active subscriptions for a tenant
   * Returns both platform and product subscriptions
   * Auto-creates missing product subscriptions based on enabled flags
   */
  static async getActiveSubscriptions(tenantId) {
    const SubscriptionPlanService = require('./SubscriptionPlanService');
    
    try {
      // NOTE: Auto-sync disabled - tenants must manually subscribe
      // await this.syncProductSubscriptions(tenantId);

      // Get tenant enabled products
      const tenant = await knex('tenants')
        .select('moneyLoanEnabled', 'bnplEnabled', 'pawnshopEnabled')
        .where({ id: tenantId })
        .first();

      const enabledProducts = [];
      if (tenant) {
        if (tenant.moneyLoanEnabled) enabledProducts.push('money_loan');
        if (tenant.bnplEnabled) enabledProducts.push('bnpl');
        if (tenant.pawnshopEnabled) enabledProducts.push('pawnshop');
      }

      const subscriptions = [];

      // Get platform subscription from tenant_subscriptions
      const platformSubs = await knex('tenantSubscriptions as ts')
        .join('subscriptionPlans as sp', 'ts.planId', 'sp.id')
        .select(
          'ts.*',
          'sp.id as planId',
          'sp.name',
          'sp.description',
          'sp.price',
          'sp.billingCycle',
          'sp.features',
          'sp.platformType',
          'sp.isPopular',
          'sp.status'
        )
        .where('ts.tenantId', tenantId)
        .where('ts.status', 'active')
        .orderBy('ts.createdAt', 'desc')
        .limit(1);

      logger.info(`📊 Platform subscriptions found: ${platformSubs.length}`);

      if (platformSubs.length > 0) {
        const sub = platformSubs[0];
        subscriptions.push(SubscriptionPlanService.transformPlan({
          id: sub.planId,
          name: sub.name,
          description: sub.description,
          price: sub.price,
          billing_cycle: sub.billingCycle,
          features: sub.features,
          platform_type: sub.platformType || 'platform',
          is_popular: sub.isPopular,
          status: sub.status,
        }));
      }

      // Get product subscriptions from platform_subscriptions
      const productSubs = await knex('platformSubscriptions as ps')
        .join('subscriptionPlans as sp', 'ps.subscriptionPlanId', 'sp.id')
        .select(
          'ps.*',
          'sp.id as planId',
          'sp.name',
          'sp.description',
          'sp.price',
          'sp.billingCycle',
          'sp.features',
          'sp.platformType',
          'sp.isPopular',
          'sp.status'
        )
        .where('ps.tenantId', tenantId)
        .where('ps.status', 'active')
        .orderBy('ps.createdAt');

      logger.info(`📊 Product subscriptions found: ${productSubs.length}`);

      for (const sub of productSubs) {
        subscriptions.push({
          ...SubscriptionPlanService.transformPlan({
            id: sub.planId,
            name: sub.name,
            description: sub.description,
            price: sub.price,
            billing_cycle: sub.billingCycle,
            features: sub.features,
            platform_type: sub.platformType,
            is_popular: sub.isPopular,
            status: sub.status,
          }),
          startedAt: sub.startedAt,
          expiresAt: sub.expiresAt,
        });
      }

      logger.info(`✅ Total active subscriptions: ${subscriptions.length}`);
      logger.info(`✅ Enabled products: ${enabledProducts.join(', ')}`);
      
      return {
        subscriptions,
        enabledProducts,
      };
    } catch (err) {
      logger.error(`Tenant service get active subscriptions error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Sync product subscriptions based on tenant enabled flags
   * Auto-creates missing subscriptions or cancels disabled ones
   */
  static async syncProductSubscriptions(tenantId) {
    try {
      // Get tenant with their enabled products
      const tenant = await knex('tenants')
        .select('plan', 'moneyLoanEnabled', 'bnplEnabled', 'pawnshopEnabled')
        .where({ id: tenantId })
        .first();

      if (!tenant) {
        return;
      }

      const platformPlan = tenant.plan || 'starter';

      // Sync Money Loan
      if (tenant.moneyLoanEnabled) {
        await this.ensureProductSubscription(tenantId, 'money_loan', platformPlan);
      }

      // Sync BNPL
      if (tenant.bnplEnabled) {
        await this.ensureProductSubscription(tenantId, 'bnpl', platformPlan);
      }

      // Sync Pawnshop
      if (tenant.pawnshopEnabled) {
        await this.ensureProductSubscription(tenantId, 'pawnshop', platformPlan);
      }

      logger.info(`✅ Synced product subscriptions for tenant ${tenantId}`);
    } catch (err) {
      logger.error(`Error syncing product subscriptions: ${err.message}`);
      // Don't throw - this is a best-effort sync
    }
  }

  /**
   * Ensure a product subscription exists
   * Auto-creates if missing
   */
  static async ensureProductSubscription(tenantId, productType, platformPlanName) {
    try {
      // Check if active subscription exists
      const existing = await knex('platformSubscriptions')
        .select('id')
        .where({
          tenantId,
          platformType: productType,
          status: 'active',
        })
        .first();

      if (existing) {
        return; // Already exists
      }

      // Find matching product plan based on platform tier
      let plan = await knex('subscriptionPlans')
        .select('id', 'price', 'billingCycle')
        .where({ platformType: productType, status: 'active' })
        .whereRaw('name ILIKE ?', [`%${platformPlanName}%`])
        .first();

      // Fallback to starter if no tier match
      if (!plan) {
        plan = await knex('subscriptionPlans')
          .select('id', 'price', 'billingCycle')
          .where({ platformType: productType, status: 'active' })
          .whereRaw('name ILIKE ?', ['%starter%'])
          .first();
      }

      if (!plan) {
        logger.warn(`No ${productType} plan found for tenant ${tenantId}`);
        return;
      }

      // Create the subscription
      await knex('platformSubscriptions').insert({
        tenantId,
        platformType: productType,
        subscriptionPlanId: plan.id,
        status: 'active',
        startedAt: knex.fn.now(),
        price: plan.price,
        billingCycle: plan.billingCycle || 'monthly',
      });

      logger.info(`✅ Auto-created ${productType} subscription for tenant ${tenantId}`);
    } catch (err) {
      logger.error(`Error ensuring product subscription: ${err.message}`);
      // Don't throw - best effort
    }
  }

  /**
   * Sync product subscriptions when tenant updates product flags
   * Creates subscriptions for enabled products, cancels for disabled
   */
  static async syncProductSubscriptionsOnUpdate(tenantId, updateData) {
    try {
      // Get current tenant state to know the platform plan
      const tenant = await knex('tenants')
        .select('plan')
        .where({ id: tenantId })
        .first();

      if (!tenant) {
        return;
      }

      const platformPlan = tenant.plan || 'starter';

      // Handle Money Loan
      if (updateData.money_loan_enabled !== undefined) {
        if (updateData.money_loan_enabled === true) {
          logger.info(`🔄 Enabling Money Loan for tenant ${tenantId}`);
          await this.ensureProductSubscription(tenantId, 'money_loan', platformPlan);
        } else {
          logger.info(`🔄 Disabling Money Loan for tenant ${tenantId}`);
          await this.cancelProductSubscription(tenantId, 'money_loan');
        }
      }

      // Handle BNPL
      if (updateData.bnpl_enabled !== undefined) {
        if (updateData.bnpl_enabled === true) {
          logger.info(`🔄 Enabling BNPL for tenant ${tenantId}`);
          await this.ensureProductSubscription(tenantId, 'bnpl', platformPlan);
        } else {
          logger.info(`🔄 Disabling BNPL for tenant ${tenantId}`);
          await this.cancelProductSubscription(tenantId, 'bnpl');
        }
      }

      // Handle Pawnshop
      if (updateData.pawnshop_enabled !== undefined) {
        if (updateData.pawnshop_enabled === true) {
          logger.info(`🔄 Enabling Pawnshop for tenant ${tenantId}`);
          await this.ensureProductSubscription(tenantId, 'pawnshop', platformPlan);
        } else {
          logger.info(`🔄 Disabling Pawnshop for tenant ${tenantId}`);
          await this.cancelProductSubscription(tenantId, 'pawnshop');
        }
      }

      logger.info(`✅ Product subscription sync completed for tenant ${tenantId}`);
    } catch (err) {
      logger.error(`Error syncing product subscriptions on update: ${err.message}`);
      // Don't throw - this shouldn't block the main update
    }
  }

  /**
   * Cancel a product subscription
   */
  static async cancelProductSubscription(tenantId, productType) {
    try {
      const cancelled = await knex('platformSubscriptions')
        .where({
          tenantId,
          platformType: productType,
          status: 'active',
        })
        .update({
          status: 'cancelled',
          updatedAt: knex.fn.now(),
        })
        .returning(['id']);

      if (cancelled.length > 0) {
        logger.info(`✅ Cancelled ${productType} subscription for tenant ${tenantId}`);
      } else {
        logger.info(`ℹ️  No active ${productType} subscription to cancel for tenant ${tenantId}`);
      }
    } catch (err) {
      logger.error(`Error cancelling product subscription: ${err.message}`);
      // Don't throw - best effort
    }
  }

  /**
   * List all tenants with pagination
   */
  static async listTenants(page = 1, limit = 20, status = null, plan = null) {
    try {
      const offset = (page - 1) * limit;

      // Build count query
      let countQuery = knex('tenants').count('* as total');
      if (status) countQuery = countQuery.where({ status });
      if (plan) countQuery = countQuery.where({ plan });

      // Build data query with subqueries
      let dataQuery = knex('tenants as t')
        .select(
          't.id',
          't.name',
          't.subdomain',
          't.plan',
          't.status',
          't.maxUsers',
          't.createdAt',
          't.moneyLoanEnabled',
          't.bnplEnabled',
          't.pawnshopEnabled',
          knex.raw('(SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as user_count'),
          knex.raw('(SELECT COUNT(*) FROM roles WHERE tenant_id = t.id) as role_count'),
          knex.raw(`(SELECT json_agg(json_build_object(
                  'productType', ps.platform_type,
                  'planName', sp.name,
                  'status', ps.status,
                  'startedAt', ps.started_at,
                  'expiresAt', ps.expires_at,
                  'price', ps.price,
                  'billingCycle', ps.billing_cycle
               ))
                FROM platform_subscriptions ps
                JOIN subscription_plans sp ON ps.subscription_plan_id = sp.id
                WHERE ps.tenant_id = t.id AND ps.status = 'active'
               ) as subscriptions`)
        )
        .orderBy('t.createdAt', 'desc')
        .limit(limit)
        .offset(offset);

      if (status) dataQuery = dataQuery.where('t.status', status);
      if (plan) dataQuery = dataQuery.where('t.plan', plan);

      const [countResult, tenants] = await Promise.all([
        countQuery,
        dataQuery,
      ]);

      const total = parseInt(countResult[0].total);

      return {
        tenants,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      logger.error(`Tenant service list error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Update tenant
   */
  static async updateTenant(tenantId, updateData, _requestingUserId) {
    try {
      logger.info('Update tenant data received:', JSON.stringify(updateData));
      
      const fieldsToUpdate = {};

      if (updateData.name !== undefined) fieldsToUpdate.name = updateData.name;
      if (updateData.plan !== undefined) fieldsToUpdate.plan = updateData.plan;
      if (updateData.status !== undefined) fieldsToUpdate.status = updateData.status;
      if (updateData.max_users !== undefined) fieldsToUpdate.maxUsers = updateData.max_users;

      // Handle colors object or direct primaryColor/secondaryColor
      if (updateData.colors?.primary !== undefined || updateData.primaryColor !== undefined) {
        fieldsToUpdate.primaryColor = updateData.colors?.primary || updateData.primaryColor;
      }
      if (updateData.colors?.secondary !== undefined || updateData.secondaryColor !== undefined) {
        fieldsToUpdate.secondaryColor = updateData.colors?.secondary || updateData.secondaryColor;
      }

      if (updateData.logo_url !== undefined) fieldsToUpdate.logoUrl = updateData.logo_url;
      if (updateData.contact_person !== undefined) fieldsToUpdate.contactPerson = updateData.contact_person;
      if (updateData.contact_email !== undefined) fieldsToUpdate.contactEmail = updateData.contact_email;
      if (updateData.contact_phone !== undefined) fieldsToUpdate.contactPhone = updateData.contact_phone;

      // Accept both camelCase and snake_case for product flags
      if (updateData.money_loan_enabled !== undefined || updateData.moneyLoanEnabled !== undefined) {
        fieldsToUpdate.moneyLoanEnabled = updateData.money_loan_enabled !== undefined ? updateData.money_loan_enabled : updateData.moneyLoanEnabled;
      }
      if (updateData.bnpl_enabled !== undefined || updateData.bnplEnabled !== undefined) {
        fieldsToUpdate.bnplEnabled = updateData.bnpl_enabled !== undefined ? updateData.bnpl_enabled : updateData.bnplEnabled;
      }
      if (updateData.pawnshop_enabled !== undefined || updateData.pawnshopEnabled !== undefined) {
        fieldsToUpdate.pawnshopEnabled = updateData.pawnshop_enabled !== undefined ? updateData.pawnshop_enabled : updateData.pawnshopEnabled;
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        throw new Error('No fields to update');
      }

      fieldsToUpdate.updatedAt = knex.fn.now();

      const [tenant] = await knex('tenants')
        .where({ id: tenantId })
        .update(fieldsToUpdate)
        .returning([
          'id',
          'name',
          'subdomain',
          'plan',
          'status',
          'maxUsers',
          'logoUrl',
          'contactPerson',
          'contactEmail',
          'contactPhone',
          'moneyLoanEnabled',
          'bnplEnabled',
          'pawnshopEnabled',
        ]);

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // If plan was updated, also update tenant_subscriptions
      if (updateData.plan !== undefined) {
        const plan = await knex('subscriptionPlans')
          .select('id', 'price')
          .whereRaw('LOWER(name) = LOWER(?)', [updateData.plan])
          .where({ status: 'active' })
          .first();

        if (plan) {
          const planId = plan.id;
          const monthlyPrice = plan.price;

          // Check if tenant has an existing active subscription
          const existingSub = await knex('tenantSubscriptions')
            .select('id', 'planId')
            .where({ tenantId, status: 'active' })
            .first();

          if (existingSub) {
            const existingPlanId = existingSub.planId;
            
            // If plan changed, cancel old subscription and create new one (preserve history)
            if (existingPlanId !== planId) {
              // Cancel existing subscription
              await knex('tenantSubscriptions')
                .where({ tenantId, status: 'active' })
                .update({
                  status: 'cancelled',
                  cancelledAt: knex.fn.now(),
                  cancellationReason: 'Plan changed',
                  updatedAt: knex.fn.now(),
                });
              logger.info(`Cancelled old subscription for tenant ${tenantId} (plan changed)`);

              // Create new subscription
              const startDate = new Date();
              const expirationDate = new Date(startDate);
              expirationDate.setFullYear(expirationDate.getFullYear() + 1);

              await knex('tenantSubscriptions').insert({
                tenantId,
                planId,
                status: 'active',
                startedAt: startDate,
                expiresAt: expirationDate,
                monthlyPrice,
              });
              logger.info(`Created new subscription for tenant ${tenantId} -> Plan ${planId}`);
            } else {
              // Same plan, just update the price if needed
              await knex('tenantSubscriptions')
                .where({ tenantId, status: 'active' })
                .update({
                  monthlyPrice,
                  updatedAt: knex.fn.now(),
                });
              logger.info(`Updated subscription price for tenant ${tenantId}`);
            }
          } else {
            // No active subscription, create new one
            const startDate = new Date();
            const expirationDate = new Date(startDate);
            expirationDate.setFullYear(expirationDate.getFullYear() + 1);

            await knex('tenantSubscriptions').insert({
              tenantId,
              planId,
              status: 'active',
              startedAt: startDate,
              expiresAt: expirationDate,
              monthlyPrice,
            });
            logger.info(`Created new subscription for tenant ${tenantId} -> Plan ${planId}`);
          }
        }
      }

      logger.info(`Tenant updated: ${tenantId}`);
      return tenant;
    } catch (err) {
      logger.error(`Tenant service update error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Suspend tenant
   */
  static async suspendTenant(tenantId, reason, _requestingUserId) {
    try {
      const [tenant] = await knex('tenants')
        .where({ id: tenantId })
        .update({
          status: 'suspended',
          updatedAt: knex.fn.now(),
        })
        .returning(['id', 'name', 'status']);

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      logger.info(`Tenant suspended: ${tenantId} - Reason: ${reason}`);
      return tenant;
    } catch (err) {
      logger.error(`Tenant service suspend error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Activate tenant
   */
  static async activateTenant(tenantId, _requestingUserId) {
    try {
      const [tenant] = await knex('tenants')
        .where({ id: tenantId })
        .update({
          status: 'active',
          updatedAt: knex.fn.now(),
        })
        .returning(['id', 'name', 'status']);

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      logger.info(`Tenant activated: ${tenantId}`);
      return tenant;
    } catch (err) {
      logger.error(`Tenant service activate error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Delete tenant (soft delete)
   */
  static async deleteTenant(tenantId, _requestingUserId) {
    try {
      const deleted = await knex('tenants')
        .where({ id: tenantId })
        .update({
          status: 'deleted',
          updatedAt: knex.fn.now(),
        })
        .returning(['id']);

      if (!deleted.length) {
        throw new Error('Tenant not found');
      }

      logger.info(`Tenant deleted: ${tenantId}`);
      return { message: 'Tenant deleted successfully' };
    } catch (err) {
      logger.error(`Tenant service delete error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Restore tenant (from soft delete)
   */
  static async restoreTenant(tenantId, _requestingUserId) {
    try {
      const [tenant] = await knex('tenants')
        .where({ id: tenantId, status: 'deleted' })
        .update({
          status: 'active',
          updatedAt: knex.fn.now(),
        })
        .returning('*');

      if (!tenant) {
        throw new Error('Tenant not found or not deleted');
      }

      const transformedTenant = this.transformTenant(tenant);

      logger.info(`Tenant restored: ${tenantId}`);
      return transformedTenant;
    } catch (err) {
      logger.error(`Tenant service restore error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get tenant statistics
   */
  static async getTenantStats(tenantId) {
    try {
      const stats = await Promise.all([
        knex('users').where({ tenantId }).count('* as count').first(),
        knex('roles').where({ tenantId}).count('* as count').first(),
        knex('userRoles as ur').join('roles as r', 'ur.roleId', 'r.id').where('r.tenantId', tenantId).count('* as count').first(),
        knex('auditLogs').where({ tenantId }).count('* as count').first(),
        knex('userSessions as us')
          .join('users as u', 'us.userId', 'u.id')
          .where('u.tenantId', tenantId)
          .where('us.status', 'active')
          .count('* as count')
          .first(),
      ]);

      return {
        totalUsers: parseInt(stats[0].count),
        totalRoles: parseInt(stats[1].count),
        totalAssignments: parseInt(stats[2].count),
        totalAuditLogs: parseInt(stats[3].count),
        activeSessions: parseInt(stats[4].count),
      };
    } catch (err) {
      logger.error(`Tenant service get stats error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Check user count against plan limit
   */
  static async validateUserLimit(tenantId) {
    try {
      const result = await knex('tenants as t')
        .leftJoin('users as u', 't.id', 'u.tenantId')
        .select('t.maxUsers')
        .count('u.id as userCount')
        .where('t.id', tenantId)
        .groupBy('t.id', 't.maxUsers')
        .first();

      if (!result) {
        throw new Error('Tenant not found');
      }

      const maxUsers = result.maxUsers;
      const userCount = parseInt(result.userCount);

      return {
        allowed: userCount < maxUsers,
        currentCount: userCount,
        maxCount: maxUsers,
        remaining: maxUsers - userCount,
      };
    } catch (err) {
      logger.error(`Tenant service validate user limit error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Create or update subscription for tenant
   */
  static async createOrUpdateSubscription(tenantId, userId, planId, billingCycle, paymentMethod) {
    try {
      // Get plan details
      const plan = await knex('subscriptionPlans')
        .where({ id: planId, status: 'active' })
        .first();

      if (!plan) {
        throw new Error('Invalid plan selected');
      }

      const isProductPlan = plan.platformType && plan.platformType !== 'platform';
      let transactionType = 'subscription';

      if (isProductPlan) {
        // Create/update product subscription
        const existingProductSub = await knex('platformSubscriptions')
          .select('id', 'status')
          .where({
            tenantId,
            platformType: plan.platformType,
          })
          .first();

        if (existingProductSub) {
          // Update existing subscription
          transactionType = existingProductSub.status === 'active' ? 'upgrade' : 'subscription';
          await knex('platformSubscriptions')
            .where({ id: existingProductSub.id })
            .update({
              subscriptionPlanId: planId,
              price: plan.price,
              billingCycle,
              status: 'active',
              startedAt: knex.fn.now(),
              updatedAt: knex.fn.now(),
            });
        } else {
          // Create new product subscription
          await knex('platformSubscriptions').insert({
            tenantId,
            platformType: plan.platformType,
            subscriptionPlanId: planId,
            status: 'active',
            startedAt: knex.fn.now(),
            price: plan.price,
            billingCycle,
          });
        }

        logger.info(`✅ Created/Updated ${plan.platformType} subscription for tenant ${tenantId}`);
      } else {
        // Create/update platform subscription
        const existingPlatformSub = await knex('tenantSubscriptions')
          .select('id', 'status')
          .where({ tenantId })
          .first();

        if (existingPlatformSub) {
          // Update existing subscription
          transactionType = existingPlatformSub.status === 'active' ? 'upgrade' : 'subscription';
          await knex('tenantSubscriptions')
            .where({ id: existingPlatformSub.id })
            .update({
              planId,
              price: plan.price,
              billingCycle,
              status: 'active',
              startedAt: knex.fn.now(),
              updatedAt: knex.fn.now(),
            });
        } else {
          // Create new platform subscription
          await knex('tenantSubscriptions').insert({
            tenantId,
            planId,
            status: 'active',
            startedAt: knex.fn.now(),
            price: plan.price,
            billingCycle,
          });
        }

        // Update tenant plan
        await knex('tenants')
          .where({ id: tenantId })
          .update({
            plan: plan.name.toLowerCase(),
            updatedAt: knex.fn.now(),
          });

        logger.info(`✅ Created/Updated platform subscription for tenant ${tenantId}`);
        
        // Reactivate enabled product subscriptions
        const tenant = await knex('tenants')
          .select('moneyLoanEnabled', 'bnplEnabled', 'pawnshopEnabled')
          .where({ id: tenantId })
          .first();
        
        if (tenant) {
          const enabledProducts = [];
          if (tenant.moneyLoanEnabled) enabledProducts.push('moneyloan');
          if (tenant.bnplEnabled) enabledProducts.push('bnpl');
          if (tenant.pawnshopEnabled) enabledProducts.push('pawnshop');
          
          logger.info(`🔄 Reactivating product subscriptions for: ${enabledProducts.join(', ')}`);
          
          for (const productType of enabledProducts) {
            const updated = await knex('platformSubscriptions')
              .where({ tenantId, platformType: productType })
              .update({
                status: 'active',
                updatedAt: knex.fn.now(),
              })
              .returning(['id', 'platformType', 'status']);
            
            if (updated.length > 0) {
              logger.info(`✅ Reactivated ${productType} subscription (ID: ${updated[0].id})`);
            } else {
              logger.info(`⚠️  No existing ${productType} subscription found to reactivate`);
            }
          }
          
          logger.info(`✅ Processed ${enabledProducts.length} product subscriptions for tenant ${tenantId}`);
        }
      }

      // Generate invoice ID
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const invoiceId = `INV-${today}-${randomSuffix}`;

      // Save payment history record
      await knex('paymentHistory').insert({
        tenantId,
        userId,
        subscriptionPlanId: planId,
        transactionId: invoiceId,
        amount: plan.price,
        currency: 'PHP',
        status: 'completed',
        provider: paymentMethod || 'credit_card',
        transactionType,
        planName: plan.name,
        platformType: plan.platformType || 'platform',
        description: `${transactionType === 'upgrade' ? 'Upgraded to' : 'Subscribed to'} ${plan.name} - ${billingCycle} billing`,
        processedAt: knex.fn.now(),
      });

      logger.info(`💳 Payment history recorded: ${invoiceId} for tenant ${tenantId}`);

      return {
        success: true,
        plan: plan.name,
        productType: plan.platformType,
        billingCycle,
        paymentMethod,
      };
    } catch (err) {
      logger.error(`Tenant service create subscription error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get payment history for a tenant with optional filters
   */
  static async getPaymentHistory(tenantId, filters = {}) {
    try {
      const { 
        dateRange = 'all', 
        transactionType = 'all', 
        status = 'all',
        page = 1,
        limit = 20,
      } = filters;

      let query = knex('paymentHistory').where({ tenantId });

      // Date range filter
      if (dateRange !== 'all') {
        let daysAgo;
        switch (dateRange) {
          case '7days': daysAgo = 7; break;
          case '30days': daysAgo = 30; break;
          case '90days': daysAgo = 90; break;
          default: daysAgo = null;
        }
        if (daysAgo) {
          query = query.where('processedAt', '>=', knex.raw(`NOW() - INTERVAL '${daysAgo} days'`));
        }
      }

      // Transaction type filter
      if (transactionType !== 'all') {
        query = query.where({ transactionType });
      }

      // Status filter
      if (status !== 'all') {
        query = query.where({ status });
      }

      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await query.clone().count('* as count').first();
      const total = parseInt(countResult.count);

      // Get paginated records
      const transactions = await query
        .select(
          'id',
          'transactionId as invoiceId',
          'transactionType',
          'amount',
          'currency',
          'status',
          'provider as paymentMethod',
          'planName',
          'platformType as productType',
          'description',
          'processedAt as date',
          'createdAt'
        )
        .orderBy('processedAt', 'desc')
        .limit(limit)
        .offset(offset);

      return {
        transactions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (err) {
      logger.error(`Get payment history error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = TenantService;
