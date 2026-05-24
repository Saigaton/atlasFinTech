import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('authGuard', () => {
  let authService: AuthService;
  let router: Router;

  const fakeRoute = {} as ActivatedRouteSnapshot;
  const fakeState = {} as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        AuthService,
      ],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('deve retornar true quando o usuário está autenticado', () => {
    spyOn(authService, 'isLoggedIn').and.returnValue(true);
    const result = TestBed.runInInjectionContext(() => authGuard(fakeRoute, fakeState));
    expect(result).toBeTrue();
  });

  it('deve navegar para /login e retornar false quando não autenticado', () => {
    spyOn(authService, 'isLoggedIn').and.returnValue(false);
    const navigateSpy = spyOn(router, 'navigate');

    const result = TestBed.runInInjectionContext(() => authGuard(fakeRoute, fakeState));

    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
