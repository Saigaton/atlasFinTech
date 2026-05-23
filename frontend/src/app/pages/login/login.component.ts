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

declare const google: {
  accounts: {
    id: {
      initialize: (config: object) => void;
      prompt:     (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
      cancel:     () => void;
    };
  };
};

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
    this._initGoogle();
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
    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        this.ngZone.run(() =>
          this.toast.error('Não foi possível abrir o popup do Google. Verifique se popups estão permitidos.')
        );
      }
    });
  }

  alternarMostrarSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  private _initGoogle(): void {
    const tentarInit = () => {
      if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback:  (response: { credential: string }) => {
            this.ngZone.run(() => this._handleGoogleCredential(response.credential));
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      }
    };

    if (typeof google !== 'undefined') {
      tentarInit();
    } else {
      const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      script?.addEventListener('load', tentarInit);
    }
  }

  private _handleGoogleCredential(idToken: string): void {
    this.googleCarregando = true;
    this.authService.googleLogin(idToken).subscribe({
      next: (res) => {
        this.toast.success(`Bem-vindo, ${res.usuario.nome.split(' ')[0]}! 👋`);
        this.authService.navigateAfterLogin();
      },
      error: () => {
        this.googleCarregando = false;
        this.toast.error('Erro ao autenticar com Google. Tente novamente.');
      },
    });
  }
}
