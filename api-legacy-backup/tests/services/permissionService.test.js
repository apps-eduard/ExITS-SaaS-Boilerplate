/**
 * Permission Service Tests
 */

const PermissionService = require('../../src/services/PermissionService');
const pool = require('../../src/config/database');

jest.mock('../../src/config/database');

describe('PermissionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasPermission', () => {
    it('should return true if user has permission', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const result = await PermissionService.hasPermission('1', 'users', 'view');
      expect(result).toBe(true);
    });

    it('should return false if user does not have permission', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const result = await PermissionService.hasPermission('1', 'users', 'delete');
      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should get all user permissions grouped by module', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          { menu_key: 'users', action_key: 'view' },
          { menu_key: 'users', action_key: 'create' },
          { menu_key: 'roles', action_key: 'view' },
        ],
      });

      const result = await PermissionService.getUserPermissions('1');
      expect(result.users).toEqual(['view', 'create']);
      expect(result.roles).toEqual(['view']);
    });
  });

  describe('delegatePermission', () => {
    it('should delegate permission to another user', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: '1', delegated_to: '2', role_id: '1', expires_at: '2025-12-31' }],
      });
      pool.query.mockResolvedValueOnce({});

      const result = await PermissionService.delegatePermission('1', '2', '1', 'tenant-1', '2025-12-31', 'Temporary');
      expect(result.delegated_to).toBe('2');
    });
  });

  describe('checkPermissionWithConstraints', () => {
    it('should check permission with constraints', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ constraints: null }],
      });

      const result = await PermissionService.checkPermissionWithConstraints('1', 'users', 'view');
      expect(result.allowed).toBe(true);
    });

    it('should deny permission if IP constraint violated', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ constraints: JSON.stringify({ allowed_ips: ['192.168.1.1'] }) }],
      });

      const result = await PermissionService.checkPermissionWithConstraints('1', 'users', 'view', { ip: '10.0.0.1' });
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('IP not allowed');
    });
  });
});
