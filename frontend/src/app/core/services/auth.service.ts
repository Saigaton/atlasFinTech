import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TokenResponse, AccessTokenResponse, LoginRequest,
  RegisterRequest, Usuario, MessageResponse, PostLoginRoute,
} from '../../core/models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = environment.apiUrl;
  private readonly POST_LOGIN_ROUTE: PostLoginRoute = '/dashboard';

  // Estado interno
  private user        = new BehaviorSubject<Usuario | null>(this.loadUser());
  private accessToken = new BehaviorSubject<string | null>(localStorage.getItem('atlas_access'));

  // Observables públicos para os componentes assinarem
  readonly user$        = this.user.asObservable();
  readonly accessToken$ = this.accessToken.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    window.addEventListener('storage', (e) => {
      if (e.key === 'atlas_access' && !e.newValue) {
        this.clearSession();
        this.router.navigate(['/login']);
      }
    });
  }

  // ── Getters síncronos ──────────────────────────────────────────────────────

  isLoggedIn(): boolean { return !!this.accessToken.getValue(); }

  getAccessToken(): string | null { return this.accessToken.getValue(); }

  getUserEmail(): string { return this.user.getValue()?.email ?? ''; }

  getUserName(): string { return this.user.getValue()?.nome?.split(' ')[0] ?? ''; }

  getUserInitials(): string {
    return (this.user.getValue()?.nome ?? '')
      .split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  }

  isVerified(): boolean { return this.user.getValue()?.is_verified ?? false; }

  // ── Autenticação ───────────────────────────────────────────────────────────

  register(data: RegisterRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.API}/auth/register`, data).pipe(
      tap(res => this.saveSession(res)),
    );
  }

  login(data: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.API}/auth/login`, data).pipe(
      tap(res => this.saveSession(res)),
    );
  }

  googleLogin(idToken: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.API}/auth/google`, { id_token: idToken }).pipe(
      tap(res => this.saveSession(res)),
    );
  }

  // ── Gestão de tokens ───────────────────────────────────────────────────────

  refreshToken(): Observable<AccessTokenResponse> {
    const refresh_token = localStorage.getItem('atlas_refresh');
    return this.http.post<AccessTokenResponse>(
      `${this.API}/auth/refresh`, { refresh_token }
    ).pipe(
      tap(res => {
        localStorage.setItem('atlas_access', res.access_token);
        this.accessToken.next(res.access_token);
      }),
    );
  }

  logout(): void {
    const refresh_token = localStorage.getItem('atlas_refresh');
    if (refresh_token) {
      this.http.post(`${this.API}/auth/logout`, { refresh_token })
        .subscribe({ error: () => {} });
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  // ── Verificação de e-mail ──────────────────────────────────────────────────

  verifyEmail(token: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API}/auth/verify-email`, { token });
  }

  resendVerification(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `${this.API}/auth/resend-verification`, { email }
    );
  }

  // ── Recuperação de senha ───────────────────────────────────────────────────

  forgotPassword(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API}/auth/forgot-password`, { email });
  }

  resetPassword(
    token: string,
    new_password: string,
    confirm_password: string
  ): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `${this.API}/auth/reset-password`,
      { token, new_password, confirm_password }
    );
  }

  // ── Navegação ──────────────────────────────────────────────────────────────

  navigateAfterLogin(): void {
    this.router.navigate([this.POST_LOGIN_ROUTE]);
  }

  // ── Helpers privados ───────────────────────────────────────────────────────

  private saveSession(res: TokenResponse): void {
    localStorage.setItem('atlas_access',  res.access_token);
    localStorage.setItem('atlas_refresh', res.refresh_token);
    localStorage.setItem('atlas_user',    JSON.stringify(res.user));
    this.accessToken.next(res.access_token);
    this.user.next(res.user);
  }

  private clearSession(): void {
    localStorage.removeItem('atlas_access');
    localStorage.removeItem('atlas_refresh');
    localStorage.removeItem('atlas_user');
    this.accessToken.next(null);
    this.user.next(null);
  }

  private loadUser(): Usuario | null {
    try {
      const raw = localStorage.getItem('atlas_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}