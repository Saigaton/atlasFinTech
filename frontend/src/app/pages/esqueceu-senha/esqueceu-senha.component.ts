import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { AuthPanelComponent } from '../../shared/components/auth-panel/auth-panel.component';
import { UnsubscriberComponent } from '../../core/unsubscriber.component';

@Component({
  selector: 'app-esqueceu-senha',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ThemeToggleComponent, AuthPanelComponent],
  templateUrl: './esqueceu-senha.component.html',
  styleUrl: './esqueceu-senha.component.scss',
})
export class EsqueceuSenhaComponent extends UnsubscriberComponent implements OnInit {
  carregando = false;
  enviado = false;
  formEsqueceuSenha!: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router,
    private formBuilder: FormBuilder,
    private toast: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.criarFormulario();
  }

  criarFormulario(): void {
    this.formEsqueceuSenha = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.formEsqueceuSenha.invalid) { this.formEsqueceuSenha.markAllAsTouched(); return; }
    this.carregando = true;

    this.authService.solicitarRecuperacaoSenha(this.formEsqueceuSenha.get('email')?.value).subscribe({
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
