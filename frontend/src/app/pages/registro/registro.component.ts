import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ThemeToggleComponent, AuthPanelComponent,
    PasswordChecklistComponent, RouterLink],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.scss'
})
export class RegistroComponent implements OnInit {
  carregando = false;
  mostrarSenha = false;
  mostrarConfirmarSenha = false;
  formRegistro!: FormGroup;

  constructor(private authService: AuthService, private router: Router, 
    private formBuilder: FormBuilder, private toast: ToastService) {}

  ngOnInit(): void {
    this.criarFormulario();
  }

  criarFormulario(){
    this.formRegistro = this.formBuilder.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      nomeEmpresa: ['', [Validators.required, Validators.minLength(3)]],
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
        this.toast.success('Conta criada! Verifique seu e-mail para ativar. 📧');
        this.router.navigate(['/pending-verification']);
      },
      error: (err: HttpErrorResponse) => {
        this.carregando = false;
        if (err.status === 0) { 
          this.toast.error("Erro na comunicação com backend.");
        }
        const msg = err.error?.detail ?? 'Erro ao criar conta.';
        this.toast.error(msg);
        if (msg.toLowerCase().includes('e-mail')) {
          this.formRegistro.get('email')?.setErrors({ emailTaken: true });
        }
      },
    });
  }

  onGoogleClick(): void {
    this.toast.info('Configure o Google Client ID para usar este recurso.');
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
