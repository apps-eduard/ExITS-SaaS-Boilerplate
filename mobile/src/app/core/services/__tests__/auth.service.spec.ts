// mobile/src/app/core/services/__tests__/auth.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../auth.service';
import { Preferences } from '@capacitor/preferences';

jest.mock('@capacitor/preferences');

describe('AuthService (Mobile)', () => {
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
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login and store tokens in Capacitor Preferences', async () => {
      const mockResponse = {
        success: true,
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: { id: '1', email: 'test@example.com' }
        }
      };

      const loginPromise = service.login('test@example.com', 'password123').toPromise();

      const req = httpMock.expectOne('/api/auth/login');
      req.flush(mockResponse);

      await loginPromise;

      expect(Preferences.setItem).toHaveBeenCalledWith({
        key: 'accessToken',
        value: 'mock-access-token'
      });
    });

    it('should handle offline mode', async () => {
      const error = { status: 0, message: 'Network error' };

      service.login('test@example.com', 'password123').subscribe(
        () => fail('should have failed'),
        (err) => {
          expect(err.status).toBe(0);
        }
      );

      const req = httpMock.expectOne('/api/auth/login');
      req.error(new ProgressEvent('error'), { status: 0 });
    });
  });

  describe('getStoredToken', () => {
    it('should retrieve token from Capacitor Preferences', async () => {
      (Preferences.getItem as jest.Mock).mockResolvedValue({ value: 'stored-token' });

      const token = await service.getStoredToken();

      expect(Preferences.getItem).toHaveBeenCalledWith({ key: 'accessToken' });
      expect(token).toBe('stored-token');
    });
  });
});
