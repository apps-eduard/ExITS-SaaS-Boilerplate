/**
 * Example: Reusable Table Query Implementation
 * Shows how to use queryHelper in Express routes
 */

import { Router, Request, Response } from 'express';
import { Knex } from 'knex';
import {
  applyTableQuery,
  sanitizeTableParams,
  TableQueryConfig
} from '../utils/queryHelper';

export function createTableRoute(db: Knex) {
  const router = Router();

  /**
   * Example 1: Loan Applications Table
   * GET /api/tenants/:tenantId/platforms/moneyloan/loans/applications
   */
  router.get('/applications', async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      
      // Sanitize query parameters
      const params = sanitizeTableParams(req.query);

      // Define configuration for this table
      const config: TableQueryConfig = {
        sortableColumns: [
          'application_number',
          'first_name',
          'last_name',
          'requested_amount',
          'requested_term_days',
          'status',
          'created_at'
        ],
        filterableColumns: [
          'status',
          'loan_product_id',
          'customer_id'
        ],
        searchableColumns: [
          'application_number',
          'first_name',
          'last_name',
          'customer_email'
        ],
        defaultSort: {
          column: 'created_at',
          direction: 'desc'
        },
        defaultPageSize: 10,
        maxPageSize: 100
      };

      // Build base query with joins
      const query = db('loan_applications')
        .where({ tenant_id: tenantId })
        .select(
          'loan_applications.*',
          db.raw(`CONCAT(loan_applications.first_name, ' ', loan_applications.last_name) as customer_name`)
        );

      // Apply table query logic
      const result = await applyTableQuery(query, params, config);

      res.json(result);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ error: 'Failed to fetch applications' });
    }
  });

  /**
   * Example 2: Transactions Table
   * GET /api/tenants/:tenantId/transactions
   */
  router.get('/transactions', async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      
      const params = sanitizeTableParams(req.query);

      const config: TableQueryConfig = {
        sortableColumns: [
          'invoice_id',
          'amount',
          'status',
          'payment_method',
          'transaction_date',
          'created_at'
        ],
        filterableColumns: [
          'status',
          'payment_method',
          'customer_id'
        ],
        searchableColumns: [
          'invoice_id',
          'customer_name',
          'description'
        ],
        defaultSort: {
          column: 'transaction_date',
          direction: 'desc'
        },
        defaultPageSize: 25,
        maxPageSize: 100
      };

      const query = db('transactions')
        .where({ tenant_id: tenantId })
        .select('*');

      const result = await applyTableQuery(query, params, config);

      res.json(result);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  /**
   * Example 3: Users Table with Complex Filtering
   * GET /api/tenants/:tenantId/users
   */
  router.get('/users', async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      
      const params = sanitizeTableParams(req.query);

      const config: TableQueryConfig = {
        sortableColumns: [
          'email',
          'first_name',
          'last_name',
          'role',
          'status',
          'created_at',
          'last_login'
        ],
        filterableColumns: [
          'role',
          'status',
          'department_id'
        ],
        searchableColumns: [
          'email',
          'first_name',
          'last_name',
          'phone'
        ],
        defaultSort: {
          column: 'created_at',
          direction: 'desc'
        },
        defaultPageSize: 15,
        maxPageSize: 50
      };

      const query = db('users')
        .where({ tenant_id: tenantId })
        .select('id', 'email', 'first_name', 'last_name', 'role', 'status', 'created_at', 'last_login');

      const result = await applyTableQuery(query, params, config);

      res.json(result);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  return router;
}
