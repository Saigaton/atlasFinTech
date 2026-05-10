import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { AuthPanelComponent } from '../../shared/components/auth-panel/auth-panel.component';
import { PasswordChecklistComponent } from '../../shared/components/password-checklist/password-checklist.component';
import { UnsubscriberComponent } from '../../core/unsubscriber.component';

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ThemeToggleComponent, AuthPanelComponent, PasswordChecklistComponent],
  templateUrl: './redefinir-senha.component.html',
  styleUrl: './redefinir-senha.component.scss',
})
export class RedefinirSenhaComponent extends UnsubscriberComponent implements OnInit {
  carregando = false;
  concluido = false;
  mostrarNovaSenha = false;
  mostrarConfirmarSenha = false;
  tokenInvalido = false;
  token = '';
  formRedefinirSenha!: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private toast: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('token');
    if (!t) { this.tokenInvalido = true; } else { this.token = t; }
    this.criarFormulario();
  }

  criarFormulario(): void {
    this.formRedefinirSenha = this.formBuilder.group({
      novaSenha:       ['', [Validators.required, this.validadorSenhaForte]],
      confirmarSenha:  ['', [Validators.required]],
    }, { validators: this.validadorSenhasIguais });
  }

  alternarMostrarNovaSenha(): void {
    this.mostrarNovaSenha = !this.mostrarNovaSenha;
  }

  alternarMostrarConfirmarSenha(): void {
    this.mostrarConfirmarSenha = !this.mostrarConfirmarSenha;
  }

  onSubmit(): void {
    if (this.formRedefinirSenha.invalid) { this.formRedefinirSenha.markAllAsTouched(); return; }
    this.carregando = true;

    this.authService.redefinirSenha(
      this.token,
      this.formRedefinirSenha.get('novaSenha')?.value,
      this.formRedefinirSenha.get('confirmarSenha')?.value,
    ).subscribe({
      next: () => {
        this.carregando = false;
        this.concluido = true;
        this.toast.success('Senha redefinida com sucesso!');
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err: HttpErrorResponse) => {
        this.carregando = false;
        const msg = err.error?.detail ?? 'Token inválido ou expirado.';
        this.toast.error(msg);
        if (err.status === 400) { this.tokenInvalido = true; }
      },
    });
  }

  validadorSenhasIguais(control: AbstractControl): ValidationErrors | null {
    const pw  = control.get('novaSenha');
    const pw2 = control.get('confirmarSenha');
    if (pw && pw2 && pw.value !== pw2.value) {
      pw2.setErrors({ senhasNaoCoincidem: true });
      return { senhasNaoCoincidem: true };
    }
    if (pw2?.errors?.['senhasNaoCoincidem']) {
      const { senhasNaoCoincidem, ...rest } = pw2.errors!;
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
