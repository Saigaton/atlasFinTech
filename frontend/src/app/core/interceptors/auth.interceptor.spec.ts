import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule, HttpTestingController,
} from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { of, throwError } from 'rxjs';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  const mockAuthWithToken = {
    getAccessToken: () => 'valid-token',
    refreshToken: () => of({ access_token: 'new-token', token_type: 'bearer', expires_in: 1800 }),
    logout: jasmine.createSpy('logout'),
    isLoggedIn: () => true,
  };

  const mockAuthNoToken = {
    getAccessToken: () => null,
    refreshToken: () => throwError(() => new Error('no refresh')),
    logout: jasmine.createSpy('logout'),
    isLoggedIn: () => false,
  };

  function setupWith(authMock: any) {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        { provide: HttpClientTestingModule, useValue: {} },
        { provide: AuthService, useValue: authMock },
      ],
    });
    http     = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => httpMock?.verify());

  it('deve adicionar Authorization header quando token existe', () => {
    setupWith(mockAuthWithToken);
    http.get('/test').subscribe();

    const req = httpMock.expectOne('/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
    req.flush({});
  });

  it('não deve adicionar Authorization header sem token', () => {
    setupWith(mockAuthNoToken);
    http.get('/test').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/test');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
  });
});
