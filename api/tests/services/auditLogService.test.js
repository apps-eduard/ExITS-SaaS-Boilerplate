/**
 * Audit Log Service Tests
 */

const AuditLogService = require('../../src/services/AuditLogService');
const pool = require('../../src/config/database');

jest.mock('../../src/config/database');

describe('AuditLogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create audit log entry', async () => {
      pool.query.mockResolvedValueOnce({});

      await AuditLogService.log('1', 'tenant-1', 'create', 'user', '2', { email: 'new@example.com' }, '192.168.1.1');
      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('getAuditLogs', () => {
    it('should get audit logs with pagination', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ total: '100' }] });
      pool.query.mockResolvedValueOnce({
        rows: [
          { id: '1', action: 'create', entity_type: 'user', email: 'admin@example.com', first_name: 'Admin', last_name: 'User' },
        ],
      });

      const result = await AuditLogService.getAuditLogs('tenant-1', {}, 1, 50);
      expect(result.logs).toHaveLength(1);
      expect(result.pagination.total).toBe(100);
    });
  });

  describe('exportAuditLogs', () => {
    it('should export audit logs as CSV', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ total: '1' }] });
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: '1',
            user_id: '1',
            action: 'create',
            entity_type: 'user',
            entity_id: '2',
            changes: '{}',
            ip_address: '192.168.1.1',
            created_at: '2025-01-01T00:00:00Z',
            email: 'admin@example.com',
            first_name: 'Admin',
            last_name: 'User',
          },
        ],
      });

      const csv = await AuditLogService.exportAuditLogs('tenant-1', {});
      expect(csv).toContain('Log ID');
      expect(csv).toContain('admin@example.com');
    });
  });

  describe('getSuspiciousActivities', () => {
    it('should identify suspicious activities', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          { user_id: '1', email: 'suspicious@example.com', login_attempts: 10, permission_changes: 5, total_actions: 15 },
        ],
      });

      const result = await AuditLogService.getSuspiciousActivities('tenant-1', 24);
      expect(result).toHaveLength(1);
      expect(result[0].login_attempts).toBeGreaterThan(5);
    });
  });
});
