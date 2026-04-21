import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { AuthPanelComponent } from '../../shared/components/auth-panel/auth-panel.component';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Tela de recuperação de senha.
 * Permite que o usuário informe seu e-mail para receber um link de reset.
 * Alterna entre dois estados: formulário e confirmação de envio.
 */
@Component({
  selector: 'app-recuperar-senha',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ThemeToggleComponent, AuthPanelComponent],
  templateUrl: './recuperar-senha.component.html',
  styleUrl: './recuperar-senha.component.scss',
})
export class RecuperarSenhaComponent {
  carregando = false;
  enviado = false;
  formRecuperarSenha!: FormGroup;

  constructor(private authService: AuthService, private router: Router, 
    private formBuilder: FormBuilder, private toast: ToastService) {}

  ngOnInit(): void {
    this.criarFormulario();
  }

  criarFormulario(){
    this.formRecuperarSenha = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    this.carregando = true;
    this.authService.recuperarSenha(this.formRecuperarSenha.get('email')?.value).subscribe({
      next: () => {
        this.carregando = false;
        this.enviado = true;
        this.toast.success('Instruções enviadas! Verifique seu e-mail.');
      },
      error: (err: HttpErrorResponse) => {
        this.carregando = false;
        this.toast.error('Erro ao enviar. Tente novamente.');
      },
    });
  }
}
