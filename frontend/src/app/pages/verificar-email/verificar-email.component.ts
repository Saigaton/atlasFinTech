import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { AuthPanelComponent } from '../../shared/components/auth-panel/auth-panel.component';
import { UnsubscriberComponent } from '../../core/unsubscriber.component';

type EstadoVerificacao = 'carregando' | 'sucesso' | 'erro' | 'jaVerificado';

@Component({
  selector: 'app-verificar-email',
  standalone: true,
  imports: [CommonModule, RouterLink, ThemeToggleComponent, AuthPanelComponent],
  templateUrl: './verificar-email.component.html',
  styleUrl: './verificar-email.component.scss',
})
export class VerificarEmailComponent extends UnsubscriberComponent implements OnInit {
  estado: EstadoVerificacao = 'carregando';
  mensagem = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {
    super();
  }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.estado = 'erro';
      this.mensagem = 'Link de verificação inválido.';
      return;
    }

    this.authService.verificarEmail(token).subscribe({
      next: (res) => {
        if (res.mensagem.includes('já verificado')) {
          this.estado = 'jaVerificado';
          this.mensagem = 'Seu e-mail já foi verificado anteriormente.';
        } else {
          this.estado = 'sucesso';
          this.mensagem = 'E-mail verificado com sucesso!';
        }
      },
      error: () => {
        this.estado = 'erro';
        this.mensagem = 'Link inválido ou expirado. Solicite um novo.';
      },
    });
  }
}
