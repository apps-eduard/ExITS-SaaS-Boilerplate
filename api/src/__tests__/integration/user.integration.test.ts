// api/src/__tests__/integration/user.integration.test.ts
import request from 'supertest';
import { expect } from '@jest/globals';
import app from '../../app';
import { db } from '../../database';
import jwt from 'jsonwebtoken';

describe('User API Integration Tests', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Get valid auth token from login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@exitsaas.com',
        password: 'admin123'
      });
    
    authToken = loginResponse.body.data.accessToken;
  });

  describe('GET /api/users', () => {
    it('should list all users with valid token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail without authentication token', async () => {
      const response = await request(app).get('/api/users');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users', () => {
    it('should create new user with valid data', async () => {
      const newUserData = {
        email: `user-${Date.now()}@example.com`,
        firstName: 'John',
        lastName: 'Doe',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newUserData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(newUserData.email);
      
      testUserId = response.body.data.id;
    });

    it('should fail with duplicate email', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'admin@exitsaas.com',
          firstName: 'Test',
          lastName: 'User',
          password: 'Password123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email',
          firstName: 'Test',
          lastName: 'User',
          password: 'Password123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUserId);
    });

    it('should fail with invalid id', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  afterAll(async () => {
    if (testUserId) {
      await db.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
  });
});
