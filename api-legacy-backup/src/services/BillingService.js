/**
 * Billing Service
 * Handles business logic for subscription plans, tenant subscriptions, and invoices
 */

const knex = require('../config/knex');

class BillingService {
  /**
   * Get all subscription plans
   */
  static async getPlans() {
    const plans = await knex('subscriptionPlans')
      .whereNot('status', 'archived')
      .orderBy('price', 'asc');
    
    return plans;
  }

  /**
   * Get plan by ID
   */
  static async getPlanById(id) {
    const plan = await knex('subscriptionPlans')
      .where({ id })
      .first();
      
    if (!plan) {
      throw new Error('Plan not found');
    }
    return plan;
  }

  /**
   * Create new subscription plan
   */
  static async createPlan(planData) {
    const { 
      name, 
      description, 
      price, 
      billingCycle, 
      features, 
      maxUsers, 
      maxStorageGb,
      platformType,
      trialDays,
      isFeatured,
      customPricing,
      status,
    } = planData;
    
    const [plan] = await knex('subscriptionPlans')
      .insert({
        name,
        description,
        price,
        billingCycle,
        features,
        maxUsers,
        maxStorageGb,
        platformType,
        trialDays: trialDays || 0,
        isFeatured: isFeatured || false,
        customPricing: customPricing || false,
        status: status || 'active',
      })
      .returning('*');
    
    return plan;
  }

  /**
   * Update subscription plan
   */
  static async updatePlan(id, planData) {
    const { 
      name, 
      description, 
      price, 
      billingCycle, 
      features, 
      maxUsers, 
      maxStorageGb, 
      status,
      platformType,
      trialDays,
      isFeatured,
      customPricing,
    } = planData;
    
    const [plan] = await knex('subscriptionPlans')
      .where({ id })
      .update({
        name,
        description,
        price,
        billingCycle,
        features,
        maxUsers,
        maxStorageGb,
        status,
        platformType,
        trialDays,
        isFeatured,
        customPricing,
        updatedAt: knex.fn.now(),
      })
      .returning('*');
    
    if (!plan) {
      throw new Error('Plan not found');
    }
    
    return plan;
  }

  /**
   * Delete (archive) subscription plan
   */
  static async deletePlan(id) {
    const [plan] = await knex('subscriptionPlans')
      .where({ id })
      .update({ status: 'archived', updatedAt: knex.fn.now() })
      .returning('id');
    
    if (!plan) {
      throw new Error('Plan not found');
    }
    
    return { success: true };
  }

  /**
   * Get all product subscriptions (used by All Subscriptions admin page)
   */
  static async getSubscriptions() {
    const subscriptions = await knex('tenantSubscriptions as ts')
      .join('tenants as t', 'ts.tenantId', 't.id')
      .join('subscriptionPlans as sp', 'ts.planId', 'sp.id')
      .select(
        'ts.id',
        'ts.tenantId',
        'ts.status',
        'ts.startedAt',  // Fixed: was startDate
        'ts.expiresAt',  // Fixed: was endDate
        'ts.createdAt',
        'ts.updatedAt',
        't.name as tenantName',
        'sp.name as planName',
        'sp.price',
        'sp.billingCycle',
      )
      .orderBy('ts.createdAt', 'desc');
      
    return subscriptions;
  }

  /**
   * Get subscription by tenant ID
   */
  static async getSubscriptionByTenant(tenantId) {
    const subscription = await knex('tenantSubscriptions as ts')
      .join('subscriptionPlans as sp', 'ts.planId', 'sp.id')
      .select(
        'ts.*',
        'sp.name as planName',
        'sp.price as planPrice',
        'sp.billingCycle',
        'sp.features',
        'sp.maxUsers',
        'sp.maxStorageGb',
      )
      .where({ 'ts.tenantId': tenantId, 'ts.status': 'active' })
      .orderBy('ts.createdAt', 'desc')
      .first();
    
    return subscription || null;
  }

  /**
   * Create new subscription
   */
  static async createSubscription(subscriptionData) {
    const { tenantId, planId, startedAt, expiresAt, trialEndsAt, autoRenew } = subscriptionData;
    
    const [subscription] = await knex('tenantSubscriptions')
      .insert({
        tenantId,
        planId,
        startedAt: startedAt || knex.fn.now(),  // Fixed: was startDate
        expiresAt,  // Fixed: was endDate
        trialEndsAt,
        autoRenew: autoRenew !== false,
      })
      .returning('*');
    
    return subscription;
  }

  /**
   * Update subscription
   */
  static async updateSubscription(id, subscriptionData) {
    const { planId, status, expiresAt, autoRenew } = subscriptionData;
    
    const [subscription] = await knex('tenantSubscriptions')
      .where({ id })
      .update({
        planId,
        status,
        expiresAt,  // Fixed: was endDate
        autoRenew,
        updatedAt: knex.fn.now(),
      })
      .returning('*');
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    return subscription;
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(id) {
    const [subscription] = await knex('tenantSubscriptions')
      .where({ id })
      .update({
        status: 'cancelled',
        autoRenew: false,
        updatedAt: knex.fn.now(),
      })
      .returning('*');
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    return subscription;
  }

  /**
   * Get invoices with filters
   */
  static async getInvoices(filters = {}) {
    let query = knex('invoices as i')
      .join('tenants as t', 'i.tenantId', 't.id')
      .select('i.*', 't.name as tenantName');
    
    if (filters.tenantId) {
      query = query.where('i.tenantId', filters.tenantId);
    }
    
    if (filters.status) {
      query = query.where('i.status', filters.status);
    }
    
    query = query.orderBy('i.createdAt', 'desc');
    
    const invoices = await query;
    return invoices;
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(id) {
    const invoice = await knex('invoices as i')
      .join('tenants as t', 'i.tenantId', 't.id')
      .select('i.*', 't.name as tenantName', 't.billingEmail')
      .where('i.id', id)
      .first();
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    return invoice;
  }

  /**
   * Create new invoice
   */
  static async createInvoice(invoiceData) {
    const { tenantId, subscriptionId, invoiceNumber, amount, tax, total, dueDate, notes } = invoiceData;
    
    const [invoice] = await knex('invoices')
      .insert({
        tenantId,
        subscriptionId,
        invoiceNumber,
        amount,
        tax: tax || 0,
        total,
        dueDate,
        notes,
      })
      .returning('*');
    
    return invoice;
  }

  /**
   * Mark invoice as paid
   */
  static async payInvoice(id, paymentData) {
    const { paymentMethod, transactionId, amount } = paymentData;
    
    return await knex.transaction(async (trx) => {
      // Update invoice
      const [invoice] = await trx('invoices')
        .where({ id })
        .update({
          status: 'paid',
          paidDate: trx.fn.now(),
          paymentMethod,
          updatedAt: trx.fn.now(),
        })
        .returning('*');
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      // Create payment history record
      await trx('paymentHistory').insert({
        tenantId: invoice.tenantId,
        invoiceId: id,
        amount: amount || invoice.total,
        paymentMethod,
        transactionId,
        status: 'completed',
      });
      
      return invoice;
    });
  }

  /**
   * Get billing statistics
   */
  static async getStats() {
    const [activePlans] = await knex('subscriptionPlans').where('status', 'active').count('* as count');
    const [activeSubscriptions] = await knex('tenantSubscriptions').where('status', 'active').count('* as count');
    const [pendingInvoices] = await knex('invoices').where('status', 'pending').count('* as count');
    const [overdueInvoices] = await knex('invoices').where('status', 'overdue').count('* as count');
    
    const [monthlyRevenue] = await knex('invoices')
      .where('status', 'paid')
      .whereRaw('EXTRACT(MONTH FROM paid_date) = EXTRACT(MONTH FROM CURRENT_DATE)')
      .sum('total as total');
    
    const [pendingRevenue] = await knex('invoices')
      .where('status', 'pending')
      .sum('total as total');
    
    return {
      activePlans: parseInt(activePlans.count),
      activeSubscriptions: parseInt(activeSubscriptions.count),
      pendingInvoices: parseInt(pendingInvoices.count),
      overdueInvoices: parseInt(overdueInvoices.count),
      monthlyRevenue: parseFloat(monthlyRevenue.total || 0),
      pendingRevenue: parseFloat(pendingRevenue.total || 0),
    };
  }

  /**
   * Get billing overview for a tenant
   */
  static async getBillingOverview(tenantId) {
    // Get current subscription - try tenant_subscriptions first
    let subscription = await knex('tenantSubscriptions as ts')
      .join('subscriptionPlans as sp', 'ts.planId', 'sp.id')
      .select(
        'ts.nextBillingDate',
        'ts.status as subscriptionStatus',
        'ts.monthlyPrice',
        'ts.metadata',
        'sp.price as planPrice',
        'sp.billingCycle',
        'sp.name as planName',
      )
      .where('ts.tenantId', tenantId)
      .whereIn('ts.status', ['active', 'trial'])
      .orderBy('ts.createdAt', 'desc')
      .first();

    // If no tenant subscription found, check platform_subscriptions
    if (!subscription) {
      subscription = await knex('platformSubscriptions as ps')
        .join('subscriptionPlans as sp', 'ps.subscriptionPlanId', 'sp.id')
        .select(
          knex.raw(`COALESCE(
            ps.expires_at,
            CASE 
              WHEN sp.billing_cycle = 'monthly' THEN ps.started_at + INTERVAL '1 month'
              WHEN sp.billing_cycle = 'quarterly' THEN ps.started_at + INTERVAL '3 months'
              WHEN sp.billing_cycle = 'yearly' THEN ps.started_at + INTERVAL '1 year'
              ELSE ps.started_at + INTERVAL '1 month'
            END
          ) as nextBillingDate`),
          'ps.status as subscriptionStatus',
          'ps.price as monthlyPrice',
          'ps.metadata',
          'sp.price as planPrice',
          'sp.billingCycle',
          'sp.name as planName',
        )
        .where('ps.tenantId', tenantId)
        .whereIn('ps.status', ['active', 'trial'])
        .orderBy('ps.createdAt', 'desc')
        .first();
    }

    // Get last completed payment
    const lastPayment = await knex('paymentHistory as ph')
      .leftJoin('invoices as i', 'ph.invoiceId', 'i.id')
      .select('ph.amount', 'ph.processedAt', 'ph.createdAt', 'i.invoiceNumber')
      .where('ph.tenantId', tenantId)
      .where('ph.status', 'completed')
      .orderByRaw('ph.processed_at DESC NULLS LAST, ph.created_at DESC')
      .first();

    // Get outstanding balance
    const balanceResult = await knex('invoices')
      .sum('totalAmount as pendingAmount')
      .where('tenantId', tenantId)
      .whereIn('status', ['pending', 'overdue'])
      .first();

    // Calculate next billing amount
    let nextBillingAmount = 0;
    if (subscription) {
      nextBillingAmount = subscription.monthlyPrice
        ? parseFloat(subscription.monthlyPrice)
        : (subscription.planPrice ? parseFloat(subscription.planPrice) : 0);
    }

    // Get auto_renew and payment method from metadata
    const metadata = subscription?.metadata || {};
    const autoRenewal = metadata.autoRenew !== undefined ? metadata.autoRenew : true;
    const paymentMethodId = metadata.paymentMethodId || null;

    // Fetch payment method details if exists
    let paymentMethod = null;
    if (paymentMethodId) {
      const pm = await knex('paymentMethods')
        .select('id', 'type', 'lastFour', 'expiryMonth', 'expiryYear', 'cardBrand', 'isDefault')
        .where({ id: paymentMethodId, tenantId })
        .first();
        
      if (pm) {
        paymentMethod = {
          id: pm.id,
          type: pm.type,
          last4: pm.lastFour,
          brand: pm.cardBrand,
          expiryMonth: pm.expiryMonth,
          expiryYear: pm.expiryYear,
          isDefault: pm.isDefault,
        };
      }
    }

    return {
      currentBalance: -parseFloat(balanceResult.pendingAmount || 0),
      nextBillingDate: subscription?.nextBillingDate || null,
      nextBillingAmount: nextBillingAmount,
      billingCycle: subscription?.billingCycle || 'monthly',
      planName: subscription?.planName || null,
      lastPaymentDate: lastPayment?.processedAt || lastPayment?.createdAt || null,
      lastPaymentAmount: lastPayment?.amount ? parseFloat(lastPayment.amount) : 0,
      lastInvoiceNumber: lastPayment?.invoiceNumber || null,
      paymentMethod: paymentMethod,
      autoRenewal: autoRenewal,
      subscriptionStatus: subscription?.subscriptionStatus || 'none',
    };
  }

  /**
   * Get billing information for a tenant
   */
  static async getBillingInfo(tenantId) {
    // Get tenant basic info
    const tenant = await knex('tenants')
      .select('name as companyName', 'billingEmail', 'contactEmail', 'contactPerson', 'contactPhone', 'metadata')
      .where({ id: tenantId })
      .first();

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const metadata = tenant.metadata || {};

    // Get billing address from addresses table
    const address = await knex('addresses')
      .select(
        'unitNumber', 'houseNumber', 'streetName', 'subdivision', 'barangay',
        'cityMunicipality', 'province', 'region', 'zipCode', 'country',
        'landmark', 'contactPerson', 'contactPhone',
      )
      .where({
        tenantId,
        addressableType: 'tenant',
        addressableId: tenantId,
        addressType: 'billing',
        status: 'active',
      })
      .orderByRaw('is_primary DESC, created_at DESC')
      .first();

    let formattedAddress = 'No address provided';
    let addressDetails = null;

    if (address) {
      const parts = [
        address.unitNumber,
        address.houseNumber,
        address.streetName,
        address.subdivision,
        address.barangay,
        address.cityMunicipality,
        address.province,
        address.zipCode,
      ].filter(Boolean);
      
      formattedAddress = parts.join(', ');
      addressDetails = {
        unitNumber: address.unitNumber,
        houseNumber: address.houseNumber,
        street: address.streetName,
        subdivision: address.subdivision,
        barangay: address.barangay,
        city: address.cityMunicipality,
        province: address.province,
        region: address.region,
        zipCode: address.zipCode,
        country: address.country || 'Philippines',
        landmark: address.landmark,
        contactPerson: address.contactPerson,
        contactPhone: address.contactPhone,
      };
    }

    return {
      companyName: tenant.companyName,
      taxId: metadata.taxId || null,
      email: tenant.billingEmail || tenant.contactEmail,
      address: formattedAddress,
      addressDetails: addressDetails,
      contactPerson: tenant.contactPerson,
      contactPhone: tenant.contactPhone,
    };
  }

  /**
   * Update billing information for a tenant
   */
  static async updateBillingInfo(tenantId, data) {
    const { companyName, taxId, email, address, contactPerson, contactPhone } = data;

    // Get current metadata
    const tenant = await knex('tenants').select('metadata').where({ id: tenantId }).first();
    const currentMetadata = tenant?.metadata || {};

    const updates = {};

    if (companyName !== undefined) updates.name = companyName;
    if (email !== undefined) updates.billingEmail = email;
    if (contactPerson !== undefined) updates.contactPerson = contactPerson;
    if (contactPhone !== undefined) updates.contactPhone = contactPhone;

    // Update metadata with taxId and address
    const updatedMetadata = { ...currentMetadata };
    if (taxId !== undefined) updatedMetadata.taxId = taxId;
    if (address !== undefined) updatedMetadata.billingAddress = address;

    updates.metadata = updatedMetadata;
    updates.updatedAt = knex.fn.now();

    if (Object.keys(updates).length <= 1) { // Only updatedAt
      throw new Error('No fields to update');
    }

    await knex('tenants').where({ id: tenantId }).update(updates);

    return {
      success: true,
      message: 'Billing information updated successfully',
    };
  }

  /**
   * Update auto-renewal setting for a tenant
   */
  static async updateAutoRenewal(tenantId, enabled) {
    // Get current metadata
    const subscription = await knex('tenantSubscriptions')
      .select('metadata')
      .where({ tenantId, status: 'active' })
      .first();

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const currentMetadata = subscription.metadata || {};
    const updatedMetadata = { ...currentMetadata, autoRenew: enabled };

    await knex('tenantSubscriptions')
      .where({ tenantId, status: 'active' })
      .update({
        metadata: updatedMetadata,
        updatedAt: knex.fn.now(),
      });

    return {
      success: true,
      message: `Auto-renewal ${enabled ? 'enabled' : 'disabled'} successfully`,
    };
  }

  /**
   * Get all available payment methods
   */
  static async getPaymentMethods() {
    const methods = await knex('paymentMethodTypes')
      .select('id', 'name', 'displayName', 'description', 'isActive')
      .where({ isActive: true })
      .orderBy('displayName', 'asc');
      
    return methods;
  }

  /**
   * Get tenant's current payment method
   */
  static async getTenantPaymentMethod(tenantId) {
    // Get payment method details from metadata
    const subscription = await knex('tenantSubscriptions as ts')
      .leftJoin('paymentMethodTypes as pmt', function() {
        this.onJsonPathEquals('ts.metadata', '$.paymentMethodId', 'pmt.id');
      })
      .select(
        'ts.metadata',
        'pmt.id as paymentMethodId',
        'pmt.name as paymentMethodName',
        'pmt.displayName as paymentMethodDisplayName',
      )
      .where({ 'ts.tenantId': tenantId, 'ts.status': 'active' })
      .first();

    if (!subscription) {
      return null;
    }

    const metadata = subscription.metadata || {};
    const paymentDetails = metadata.paymentDetails || {};

    return {
      paymentMethodId: subscription.paymentMethodId,
      paymentMethodName: subscription.paymentMethodName,
      paymentMethodDisplayName: subscription.paymentMethodDisplayName,
      details: paymentDetails,
    };
  }

  /**
   * Update tenant's payment method
   */
  static async updateTenantPaymentMethod(tenantId, paymentMethodId, details = {}) {
    // Verify payment method exists
    const paymentMethod = await knex('paymentMethodTypes')
      .select('id', 'name')
      .where({ id: paymentMethodId, isActive: true })
      .first();

    if (!paymentMethod) {
      throw new Error('Invalid payment method');
    }

    // Check for active subscription in tenantSubscriptions first
    let subscription = await knex('tenantSubscriptions')
      .select('metadata')
      .where({ tenantId, status: 'active' })
      .first();

    let tableName = 'tenantSubscriptions';

    // If not found, check platformSubscriptions
    if (!subscription) {
      subscription = await knex('platformSubscriptions')
        .select('metadata')
        .where({ tenantId, status: 'active' })
        .first();
      tableName = 'platformSubscriptions';
    }

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const currentMetadata = subscription.metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      paymentMethodId,
      paymentDetails: details,
    };

    // Update metadata
    const updated = await knex(tableName)
      .where({ tenantId, status: 'active' })
      .update({
        metadata: updatedMetadata,
        updatedAt: knex.fn.now(),
      });

    if (!updated) {
      throw new Error('Failed to update payment method');
    }

    return {
      success: true,
      message: 'Payment method updated successfully',
      data: {
        paymentMethodId,
        paymentMethodName: paymentMethod.name,
      },
    };
  }
}

module.exports = BillingService;
