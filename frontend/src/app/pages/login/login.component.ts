import { Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { RequisicaoLoginUsuario } from '../../core/models/auth.models';
import { HttpErrorResponse } from '@angular/common/http';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { AuthPanelComponent } from '../../shared/components/auth-panel/auth-panel.component';
import { UnsubscriberBase } from '../../core/unsubscriber';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ThemeToggleComponent, AuthPanelComponent, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent extends UnsubscriberBase implements OnInit {
  carregando       = false;
  mostrarSenha     = false;
  googleCarregando = false;
  destacarGoogle   = false;
  formLogin!: FormGroup;

  private _popup:      Window | null = null;
  private _msgHandler: ((e: MessageEvent) => void) | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService,
    private formBuilder: FormBuilder,
    private ngZone: NgZone,
  ) {
    super();
  }

  ngOnInit(): void {
    this.criarFormulario();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this._msgHandler) window.removeEventListener('message', this._msgHandler);
    this._popup?.close();
  }

  criarFormulario(): void {
    this.formLogin = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    this.carregando = true;
    this.authService.login(this.formLogin.value as RequisicaoLoginUsuario).subscribe({
      next: (res) => {
        this.toast.success(`Bem-vindo de volta, ${res.usuario.nome.split(' ')[0]}! 👋`);
        this.authService.navigateAfterLogin();
      },
      error: (err: HttpErrorResponse) => {
        this.carregando = false;
        if (err.status === 0) {
          this.toast.error('Erro na comunicação com backend.');
          return;
        }
        const msg = err.error?.erro ?? 'Erro ao fazer login.';
        const isContaGoogle = msg.toLowerCase().includes('google');
        this.toast.error(msg);
        if (err.status === 401 && !isContaGoogle) {
          this.formLogin.get('senha')?.setErrors({ invalidCredentials: true });
          this.formLogin.get('email')?.setErrors({ invalidCredentials: true });
        }
        if (isContaGoogle) {
          this.destacarGoogle = true;
          setTimeout(() => this.destacarGoogle = false, 3000);
        }
      },
    });
  }

  onGoogleClick(): void {
    if (this.googleCarregando || this.carregando) return;

    if (this._popup && !this._popup.closed) {
      this._popup.focus();
      return;
    }

    const nonce  = Math.random().toString(36).substring(2);
    const params = new URLSearchParams({
      client_id:     environment.googleClientId,
      redirect_uri:  `${window.location.origin}/oauth-callback`,
      response_type: 'id_token',
      scope:         'openid email profile',
      nonce,
      prompt:        'select_account',
    });

    this._popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      'google-auth',
      'width=520,height=620,left=200,top=80'
    );

    if (!this._popup) {
      this.toast.error('Popup bloqueado pelo navegador. Permita popups para este site.');
      return;
    }

    if (this._msgHandler) window.removeEventListener('message', this._msgHandler);

    this._msgHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'google-auth-success') {
        window.removeEventListener('message', this._msgHandler!);
        this._msgHandler = null;
        this.ngZone.run(() => this._handleGoogleCredential(event.data.id_token));
      } else if (event.data?.type === 'google-auth-error') {
        window.removeEventListener('message', this._msgHandler!);
        this._msgHandler = null;
        this.ngZone.run(() => this.toast.error('Erro ao autenticar com Google. Tente novamente.'));
      }
    };

    window.addEventListener('message', this._msgHandler);
  }

  alternarMostrarSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  private _handleGoogleCredential(idToken: string): void {
    this.googleCarregando = true;
    this.authService.googleLogin(idToken).subscribe({
      next: (res) => {
        this.toast.success(`Bem-vindo de volta, ${res.usuario.nome.split(' ')[0]}! 👋`);
        this.authService.navigateAfterLogin();
      },
      error: () => {
        this.googleCarregando = false;
        this.toast.error('Erro ao autenticar com Google. Tente novamente.');
      },
    });
  }
}
