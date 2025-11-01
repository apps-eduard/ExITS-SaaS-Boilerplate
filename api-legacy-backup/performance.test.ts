// api/performance.test.ts - Performance & Load Testing
import { performance } from 'perf_hooks';
import request from 'supertest';
import app from './src/app';

describe('Performance & Load Testing', () => {
  const iterations = 100;
  const concurrentRequests = 10;

  let authToken: string;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@exitsaas.com',
        password: 'admin123'
      });
    
    authToken = loginResponse.body.data.accessToken;
  });

  describe('API Response Time', () => {
    it('should respond to user list within 100ms', async () => {
      const start = performance.now();
      
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`);
      
      const end = performance.now();
      const responseTime = end - start;

      console.log(`User list response time: ${responseTime}ms`);
      expect(responseTime).toBeLessThan(100);
    });

    it('should respond to auth endpoints within 50ms', async () => {
      const start = performance.now();
      
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@exitsaas.com',
          password: 'admin123'
        });
      
      const end = performance.now();
      const responseTime = end - start;

      console.log(`Auth response time: ${responseTime}ms`);
      expect(responseTime).toBeLessThan(50);
    });
  });

  describe('Load Testing', () => {
    it('should handle concurrent requests', async () => {
      const promises = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      const start = performance.now();
      const responses = await Promise.all(promises);
      const end = performance.now();

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      const totalTime = end - start;
      const avgTime = totalTime / concurrentRequests;
      
      console.log(`Concurrent requests total time: ${totalTime}ms, avg: ${avgTime}ms`);
      expect(avgTime).toBeLessThan(150);
    });

    it('should maintain performance under load', async () => {
      const responseTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        
        await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${authToken}`);
        
        const end = performance.now();
        responseTimes.push(end - start);
      }

      const avgTime = responseTimes.reduce((a, b) => a + b, 0) / iterations;
      const maxTime = Math.max(...responseTimes);
      const minTime = Math.min(...responseTimes);

      console.log(`Performance stats - Avg: ${avgTime}ms, Max: ${maxTime}ms, Min: ${minTime}ms`);
      expect(avgTime).toBeLessThan(100);
      expect(maxTime).toBeLessThan(200);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory under repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < 50; i++) {
        await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${authToken}`);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const increaseInMB = memoryIncrease / 1024 / 1024;

      console.log(`Memory increase: ${increaseInMB.toFixed(2)}MB`);
      // Allow up to 10MB increase
      expect(increaseInMB).toBeLessThan(10);
    });
  });
});
