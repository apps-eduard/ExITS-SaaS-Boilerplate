// api/src/__tests__/integration/auth.integration.test.ts
import request from 'supertest';
import { expect } from '@jest/globals';
import app from '../../app';
import { db } from '../../database';
import bcrypt from 'bcryptjs';

describe('Authentication Integration Tests', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Clear users table
    await db.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
    
    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const result = await db.query(
      'INSERT INTO users (email, password, first_name, last_name, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['test@example.com', hashedPassword, 'Test', 'User', true]
    );
    testUserId = result.rows[0].id;
  });

  afterAll(async () => {
    await db.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.id).toBe(testUserId);
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.data.message).toContain('Invalid credentials');
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
