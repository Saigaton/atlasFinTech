import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { AuthPanelComponent } from '../../shared/components/auth-panel/auth-panel.component';
import { UnsubscriberComponent } from '../../core/unsubscriber.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-verificacao-pendente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ThemeToggleComponent, AuthPanelComponent],
  templateUrl: './verificacao-pendente.component.html',
  styleUrl: './verificacao-pendente.component.scss',
})
export class VerificacaoPendenteComponent extends UnsubscriberComponent implements OnInit {
  carregando = false;
  enviado    = false;
  contagem   = 0;

  private _temporizador: ReturnType<typeof setInterval> | null = null;

  formulario!: FormGroup;

  constructor(
    private authService: AuthService,
    private toast:       ToastService,
    private formBuilder: FormBuilder,
  ) {
    super();
  }

  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
      email: [this.authService.getEmailUsuario(), [Validators.required, Validators.email]],
    });
  }

  aoEnviar(): void {
    if (this.formulario.invalid || this.contagem > 0) return;
    this.carregando = true;

    this.authService.resendVerification(this.formulario.get('email')!.value).subscribe({
      next: () => {
        this.carregando = false;
        this.enviado    = true;
        this.toast.success('E-mail de verificação reenviado!');
        this._iniciarContagem();
      },
      error: () => {
        this.carregando = false;
        this.toast.error('Erro ao reenviar. Tente novamente.');
      },
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
