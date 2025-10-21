// web/src/app/core/services/__tests__/auth.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('login', () => {
    it('should login successfully', (done) => {
      const mockResponse = {
        success: true,
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: { id: '1', email: 'test@example.com' }
        }
      };

      service.login('test@example.com', 'password123').subscribe((response) => {
        expect(response.success).toBe(true);
        expect(localStorage.getItem('accessToken')).toBe('mock-access-token');
        done();
      });

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle login error', (done) => {
      service.login('test@example.com', 'wrong-password').subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(401);
          done();
        }
      );

      const req = httpMock.expectOne('/api/auth/login');
      req.flush({ success: false }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('should clear tokens on logout', () => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('refreshToken', 'mock-refresh');

      service.logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('getAccessToken', () => {
    it('should return access token from localStorage', () => {
      const mockToken = 'mock-access-token';
      localStorage.setItem('accessToken', mockToken);

      const token = service.getAccessToken();

      expect(token).toBe(mockToken);
    });

    it('should return null if token not found', () => {
      const token = service.getAccessToken();
      expect(token).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('accessToken', 'mock-token');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when token does not exist', () => {
      expect(service.isAuthenticated()).toBe(false);
    });
  });
});
