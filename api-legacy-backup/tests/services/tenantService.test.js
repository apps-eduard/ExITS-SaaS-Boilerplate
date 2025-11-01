/**
 * Tenant Service Tests
 */

const TenantService = require('../../src/services/TenantService');
const pool = require('../../src/config/database');

jest.mock('../../src/config/database');

describe('TenantService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTenant', () => {
    it('should create a new tenant', async () => {
      const newTenant = {
        name: 'Acme Corp',
        subdomain: 'acmecorp',
        plan: 'pro',
      };

      pool.query.mockResolvedValueOnce({ rows: [] }); // Check subdomain
      pool.query.mockResolvedValueOnce({ rows: [{ id: '1', ...newTenant }] }); // Create tenant
      pool.query.mockResolvedValueOnce({}); // Create roles x 4
      pool.query.mockResolvedValueOnce({});
      pool.query.mockResolvedValueOnce({});
      pool.query.mockResolvedValueOnce({});

      const result = await TenantService.createTenant(newTenant, '1');
      expect(result.name).toBe('Acme Corp');
    });

    it('should throw error if subdomain already taken', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: '1' }] });

      await expect(
        TenantService.createTenant({ name: 'Test', subdomain: 'existing', plan: 'basic' }, '1')
      ).rejects.toThrow('Subdomain already taken');
    });
  });

  describe('getTenantById', () => {
    it('should get tenant with stats', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: '1', name: 'Acme', subdomain: 'acme', plan: 'pro', max_users: 100, colors: null }],
      });
      pool.query.mockResolvedValueOnce({ rows: [{ count: '25' }] }); // Users
      pool.query.mockResolvedValueOnce({ rows: [{ count: '5' }] }); // Roles

      const result = await TenantService.getTenantById('1');
      expect(result.name).toBe('Acme');
      expect(result.user_count).toBe(25);
      expect(result.role_count).toBe(5);
    });
  });

  describe('validateUserLimit', () => {
    it('should validate user limit', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ max_users: 100, user_count: '75' }],
      });

      const result = await TenantService.validateUserLimit('1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(25);
    });

    it('should deny when user limit reached', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ max_users: 50, user_count: '50' }],
      });

      const result = await TenantService.validateUserLimit('1');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });
});
