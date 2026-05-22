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
import { UnsubscriberComponent } from '../../core/unsubscriber.component';
import { environment } from '../../../environments/environment';

declare const google: {
  accounts: {
    id: {
      initialize: (config: object) => void;
      prompt:     (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
    };
  };
};

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ThemeToggleComponent, AuthPanelComponent,
    PasswordChecklistComponent, RouterLink],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.scss'
})
export class RegistroComponent extends UnsubscriberComponent implements OnInit {
  carregando       = false;
  mostrarSenha     = false;
  mostrarConfirmarSenha = false;
  googleCarregando = false;
  formRegistro!: FormGroup;

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
    this._initGoogle();
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
    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        this.ngZone.run(() =>
          this.toast.error('Não foi possível abrir o popup do Google. Verifique se popups estão permitidos.')
        );
      }
    });
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
