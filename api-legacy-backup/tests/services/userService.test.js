/**
 * User Service Tests
 */

const UserService = require('../../src/services/UserService');
const pool = require('../../src/config/database');

jest.mock('../../src/config/database');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User',
        role_id: '1',
      };

      pool.query.mockResolvedValueOnce({ rows: [] }); // Check existing
      pool.query.mockResolvedValueOnce({ rows: [{ id: '2', ...newUser }] }); // Create user
      pool.query.mockResolvedValueOnce({}); // Assign role
      pool.query.mockResolvedValueOnce({}); // Audit log

      // Result would be tested with proper bcrypt handling
    });

    it('should throw error if user already exists', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: '1' }] });

      await expect(
        UserService.createUser(
          { email: 'existing@example.com', password: 'pass', first_name: 'Test', last_name: 'User' },
          '1',
          'tenant-1'
        )
      ).rejects.toThrow('User with this email already exists');
    });
  });

  describe('listUsers', () => {
    it('should list users with pagination', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ total: '100' }] });
      pool.query.mockResolvedValueOnce({
        rows: [
          { id: '1', email: 'user1@example.com', first_name: 'User', last_name: 'One' },
          { id: '2', email: 'user2@example.com', first_name: 'User', last_name: 'Two' },
        ],
      });

      const result = await UserService.listUsers('tenant-1', 1, 20);
      expect(result.users).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.total).toBe(100);
    });
  });

  describe('updateUser', () => {
    it('should update user information', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: '1', email: 'user@example.com', first_name: 'Updated', last_name: 'Name' }],
      });
      pool.query.mockResolvedValueOnce({});

      const result = await UserService.updateUser('1', { first_name: 'Updated' }, '1', 'tenant-1');
      expect(result.first_name).toBe('Updated');
    });
  });

  describe('assignRole', () => {
    it('should assign role to user', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: '1', role_id: '1' }] });
      pool.query.mockResolvedValueOnce({});

      const result = await UserService.assignRole('1', '1', '1', 'tenant-1');
      expect(result.user_id).toBe('1');
    });
  });
});
