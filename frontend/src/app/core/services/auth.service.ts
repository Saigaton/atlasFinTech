import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RespostaToken, AccessTokenResponse,
  RequisicaoRegistroUsuario, Usuario, MensagemResposta,
  RequisicaoLoginUsuario,
} from '../../core/models/auth.models';
import { UnsubscriberComponent } from '../unsubscriber.component';

@Injectable({ providedIn: 'root' })
export class AuthService extends UnsubscriberComponent {
  private readonly API = environment.apiUrl;

  private emailParaConfirmacao: string = '';

  // Estado interno
  private user        = new BehaviorSubject<Usuario | null>(null);
  private accessToken = new BehaviorSubject<string | null>(localStorage.getItem('atlas_access'));

  // Observables públicos para os componentes assinarem
  readonly user$        = this.user.asObservable();
  readonly accessToken$ = this.accessToken.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    super();
    window.addEventListener('storage', (e) => {
      if (e.key === 'atlas_access' && !e.newValue) {
        this.clearSession();
        this.router.navigate(['/login']);
      }
    });
  }


  isLoggedIn(): boolean { return !!this.accessToken.getValue(); }

  getAccessToken(): string | null { return this.accessToken.getValue(); }

  getEmailUsuario(): string { return this.user.getValue()?.email ?? ''; }

  getEmailParaConfirmacao(): string { return this.emailParaConfirmacao ?? ''; }

  setEmailParaConfirmacao(email: string): void { this.emailParaConfirmacao = email }

  getNomeUsuario(): string { return this.user.getValue()?.nome?.split(' ')[0] ?? ''; }

  getIniciaisUsuario(): string {
    return (this.user.getValue()?.nome ?? '')
      .split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  }

  // ── Autenticação ───────────────────────────────────────────────────────────

  registro(data: RequisicaoRegistroUsuario): Observable<RespostaToken> {
    return this.http.post<RespostaToken>(`${this.API}/auth/registro`, data);
  }

  login(data: RequisicaoLoginUsuario): Observable<RespostaToken> {
    return this.http.post<RespostaToken>(`${this.API}/auth/login`, data).pipe(
      tap(res => this.saveSession(res)),
    );
  }

  googleLogin(idToken: string): Observable<RespostaToken> {
    return this.http.post<RespostaToken>(`${this.API}/auth/google`, { id_token: idToken }).pipe(
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

  verificarEmail(token: string): Observable<MensagemResposta> {
    return this.http.get<MensagemResposta>(`${this.API}/auth/verificar-email`, {
      params: { token }
    });    
  }

  enviarEmailVerificacao(email: string): Observable<MensagemResposta> {
    return this.http.post<MensagemResposta>(
      `${this.API}/auth/reenviar-verificacao-email`, { email }
    );
  }

  // ── Perfil do usuário ──────────────────────────────────────────────────────

  obterUsuario(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.API}/auth/me`);
  }

  atualizarPerfil(dados: { nome: string }): Observable<{ data: Usuario }> {
    return this.http.put<{ data: Usuario }>(`${this.API}/auth/me`, dados).pipe(
      tap(res => {
        this.user.next(res.data);
      }),
    );
  }

  alterarSenha(dados: {
    senha_atual: string; nova_senha: string; confirmar_nova_senha: string;
  }): Observable<MensagemResposta> {
    return this.http.post<MensagemResposta>(`${this.API}/auth/me/trocar-senha`, dados);
  }

  definirSenha(dados: { novaSenha: string; confirmarSenha: string }): Observable<MensagemResposta> {
    return this.http.post<MensagemResposta>(`${this.API}/auth/me/definir-senha`, dados);
  }

  // ── Recuperação de senha ───────────────────────────────────────────────────

  solicitarRecuperacaoSenha(email: string): Observable<MensagemResposta> {
    return this.http.post<MensagemResposta>(`${this.API}/auth/esqueceu-senha`, { email });
  }

  redefinirSenha(
    token: string,
    novaSenha: string,
    confirmarSenha: string
  ): Observable<MensagemResposta> {
    return this.http.post<MensagemResposta>(
      `${this.API}/auth/redefinir-senha`,
      { token, novaSenha, confirmarSenha }
    );
  }

  // ── Navegação ──────────────────────────────────────────────────────────────

  navigateAfterLogin(): void {
    this.router.navigate(['/']);
  }

  // ── Helpers privados ───────────────────────────────────────────────────────

  private saveSession(res: RespostaToken): void {
    localStorage.setItem('atlas_access',  res.token.access_token);
    localStorage.setItem('atlas_refresh', res.token.refresh_token);
    this.accessToken.next(res.token.access_token);
    this.user.next(res.usuario);
  }

  private clearSession(): void {
    localStorage.removeItem('atlas_access');
    localStorage.removeItem('atlas_refresh');
    localStorage.removeItem('atlas_empresa');
    this.accessToken.next(null);
    this.user.next(null);
  }

  loadUser(): void {
    this.obterUsuario().subscribe({
      next: res => {
        this.user.next(res ?? null);
      },
      error: (erro: any) => {
        console.error('Erro ao carregar usuário:', erro);
        this.user.next(null);
      }
    });
  }
}