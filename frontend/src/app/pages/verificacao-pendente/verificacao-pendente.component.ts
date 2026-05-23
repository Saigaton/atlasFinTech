import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { AuthPanelComponent } from '../../shared/components/auth-panel/auth-panel.component';
import { UnsubscriberBase } from '../../core/unsubscriber';
import { handleApiError } from '../../core/handlers/handle-api-error';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-verificacao-pendente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ThemeToggleComponent, AuthPanelComponent],
  templateUrl: './verificacao-pendente.component.html',
  styleUrl: './verificacao-pendente.component.scss',
})
export class VerificacaoPendenteComponent extends UnsubscriberBase implements OnInit {
  carregando = false;
  enviado    = false;
  contagem   = 0;

  email = '';

  private _temporizador: ReturnType<typeof setInterval> | null = null;

  formulario!: FormGroup;

  constructor(
    private authService: AuthService,
    private toast:       ToastService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    this.email = this.authService.getEmailParaConfirmacao();
    this.formulario = this.formBuilder.group({
      email: [this.email, [Validators.required, Validators.email]],
    });
    if (!this.email || this.email.trim() === '') {
      this.router.navigate(['/registro']);
      return;
    }
    this.aoEnviar();
  }

  aoEnviar(): void {
    if (this.formulario.invalid || this.contagem > 0) return;
    this.carregando = true;

    this.authService.enviarEmailVerificacao(this.email).pipe(
      handleApiError(this.toast, 'Erro ao enviar. Tente novamente.')
    ).subscribe({
      next: () => {
        this.carregando = false;
        this.enviado    = true;
        this.toast.success('E-mail de verificação enviado!');
        this._iniciarContagem();
      },
      error: () => { this.carregando = false; },
    });
  }

  private _iniciarContagem(): void {
    this.contagem = 60;
    this._temporizador = setInterval(() => {
      this.contagem -= 1;
      if (this.contagem <= 0) {
        this._limparTemporizador();
      }
    }, 1000);
  }

  private _limparTemporizador(): void {
    if (this._temporizador !== null) {
      clearInterval(this._temporizador);
      this._temporizador = null;
    }
  }

  override ngOnDestroy(): void {
    this._limparTemporizador();
    super.ngOnDestroy();
  }
}
