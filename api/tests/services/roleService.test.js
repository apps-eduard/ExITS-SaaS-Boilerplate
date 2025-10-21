/**
 * Role Service Tests
 */

const RoleService = require('../../src/services/RoleService');
const pool = require('../../src/config/database');

jest.mock('../../src/config/database');

describe('RoleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      const newRole = {
        name: 'Editor',
        description: 'Editor role',
        space: 'tenant',
      };

      pool.query.mockResolvedValueOnce({ rows: [{ id: '3', ...newRole }] });
      pool.query.mockResolvedValueOnce({});

      const result = await RoleService.createRole(newRole, '1', 'tenant-1');
      expect(result.name).toBe('Editor');
    });
  });

  describe('getRoleById', () => {
    it('should get role with permissions', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: '1', name: 'Admin', space: 'tenant' }],
      });
      pool.query.mockResolvedValueOnce({
        rows: [
          { id: '1', menu_key: 'users', action_key: 'view', status: 'active' },
          { id: '2', menu_key: 'users', action_key: 'create', status: 'active' },
        ],
      });

      const result = await RoleService.getRoleById('1', 'tenant-1');
      expect(result.name).toBe('Admin');
      expect(result.permissions).toHaveLength(2);
    });
  });

  describe('deleteRole', () => {
    it('should not delete role with assigned users', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ count: '5' }] });

      await expect(RoleService.deleteRole('1', '1', 'tenant-1')).rejects.toThrow(
        'Cannot delete role with assigned users'
      );
    });
  });

  describe('grantPermission', () => {
    it('should grant permission to role', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: '1', role_id: '1', module_id: '1', action_key: 'view', status: 'active' }],
      });
      pool.query.mockResolvedValueOnce({});

      const result = await RoleService.grantPermission('1', '1', 'view', null, '1', 'tenant-1');
      expect(result.action_key).toBe('view');
    });
  });
});
