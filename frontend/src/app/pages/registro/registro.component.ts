import { Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { AuthPanelComponent } from '../../shared/components/auth-panel/auth-panel.component';
import { ToastService } from '../../core/services/toast.service';
import { RequisicaoRegistroUsuario } from '../../core/models/auth.models';
import { HttpErrorResponse } from '@angular/common/http';
import { PasswordChecklistComponent } from '../../shared/components/password-checklist/password-checklist.component';
import { UnsubscriberBase } from '../../core/unsubscriber';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ThemeToggleComponent, AuthPanelComponent,
    PasswordChecklistComponent, RouterLink],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.scss'
})
export class RegistroComponent extends UnsubscriberBase implements OnInit {
  carregando            = false;
  mostrarSenha          = false;
  mostrarConfirmarSenha = false;
  googleCarregando      = false;
  formRegistro!: FormGroup;

  private _popup:      Window | null = null;
  private _msgHandler: ((e: MessageEvent) => void) | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private formBuilder: FormBuilder,
    private toast: ToastService,
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

  criarFormulario(){
    this.formRegistro = this.formBuilder.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, this.validadorSenhaForte]],
      confirmarSenha: ['', [Validators.required, Validators.minLength(8)]]
    },
    { validators: this.validadorSenhasIguais });
  }

  alternarMostrarSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  onSubmit(): void {
    this.carregando = true;
    this.authService.registro(this.formRegistro.value as RequisicaoRegistroUsuario).subscribe({
      next: () => {
        this.authService.setEmailParaConfirmacao(this.formRegistro.value.email);
        this.toast.success('Conta criada! Verifique seu e-mail para ativar. 📧');
        this.router.navigate(['/verificacao-pendente']);
      },
      error: (err: any) => {
        this.carregando = false;
        if (err.status === 0) {
          this.toast.error("Erro na comunicação com backend.");
        }
        const msg = err.error?.erro ?? 'Erro ao criar conta.';
        this.toast.error(msg);
        if (msg.toLowerCase().includes('e-mail')) {
          this.formRegistro.get('email')?.setErrors({ emailTaken: true });
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

  private _handleGoogleCredential(idToken: string): void {
    this.googleCarregando = true;
    this.authService.googleLogin(idToken).subscribe({
      next: (res) => {
        this.toast.success(`Conta criada com sucesso! Bem-vindo, ${res.usuario.nome.split(' ')[0]}! 🎉`);
        this.authService.navigateAfterLogin();
      },
      error: () => {
        this.googleCarregando = false;
        this.toast.error('Erro ao cadastrar com Google. Tente novamente.');
      },
    });
  }

  validadorSenhasIguais(control: AbstractControl): ValidationErrors | null {
    const pw  = control.get('senha');
    const pw2 = control.get('confirmarSenha');
    if (pw && pw2 && pw.value !== pw2.value) {
      pw2.setErrors({ senhasNaoCoincidem: true });
      return { senhasNaoCoincidem: true };
    }
    if (pw2?.errors?.['senhasNaoCoincidem']) {
      const { senhasNaoCoincidem, ...rest } = pw2.errors;
      pw2.setErrors(Object.keys(rest).length ? rest : null);
    }
    return null;
  }

  validadorSenhaForte(control: AbstractControl): ValidationErrors | null {
    const v = control.value ?? '';

    const valid =
      v.length >= 8 &&
      /[A-Z]/.test(v) &&
      /[0-9]/.test(v) &&
      /[^A-Za-z0-9]/.test(v);

    return valid ? null : { passwordStrength: true };
  }
}
