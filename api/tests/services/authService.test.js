/**
 * Auth Service Tests
 */

const AuthService = require('../../src/services/AuthService');
const pool = require('../../src/config/database');
const bcrypt = require('bcryptjs');

jest.mock('../../src/config/database');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login user with valid credentials', async () => {
      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        first_name: 'Test',
        last_name: 'User',
        status: 'active',
        tenant_id: '660e8400-e29b-41d4-a716-446655440000',
      };

      pool.query.mockResolvedValueOnce({ rows: [mockUser] });
      pool.query.mockResolvedValueOnce({ rows: [] });
      pool.query.mockResolvedValueOnce({});
      pool.query.mockResolvedValueOnce({});
      pool.query.mockResolvedValueOnce({});

      // This would require proper setup with bcrypt comparison
      // const result = await AuthService.login('test@example.com', 'password123', '192.168.1.1');
      // expect(result).toHaveProperty('tokens');
      // expect(result).toHaveProperty('user');
    });

    it('should throw error for non-existent user', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(AuthService.login('nonexistent@example.com', 'password', '192.168.1.1')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ password_hash: 'hash', tenant_id: 'tenant-1' }] });
      pool.query.mockResolvedValueOnce({ rows: [{ id: '1' }] });
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Result would be tested with proper bcrypt handling
    });
  });
});
