import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { RequisicaoLoginUsuario } from '../../core/models/auth.models';
import { HttpErrorResponse } from '@angular/common/http';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { AuthPanelComponent } from '../../shared/components/auth-panel/auth-panel.component';
import { UnsubscriberComponent } from '../../core/unsubscriber.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ThemeToggleComponent, AuthPanelComponent, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent extends UnsubscriberComponent implements OnInit {
  carregando = false;
  mostrarSenha = false;
  formLogin!: FormGroup;

  constructor(private authService: AuthService, private router: Router,
    private toast: ToastService, private formBuilder: FormBuilder
  ) {
    super();
  }

  ngOnInit(): void {
   this.criarFormulario();
  }

  criarFormulario(){
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
        // Navega para a rota configurada em AuthService.POST_LOGIN_ROUTE
        this.authService.navigateAfterLogin();
      },
      error: (err: HttpErrorResponse) => {
        this.carregando = false;
        if (err.status === 0) { 
          this.toast.error("Erro na comunicação com backend.");
        }
        const msg = err.error?.detail ?? 'Erro ao fazer login.';
        this.toast.error(msg);
        if (err.status === 401) {
          this.formLogin.get('senha')?.setErrors({ invalidCredentials: true });
          this.formLogin.get('email')?.setErrors({ invalidCredentials: true });
        }
      },
    });
  }

  alternarMostrarSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  onGoogleClick(): void {
    this.toast.info('Configure o Google Client ID para usar este recurso.');
  }
}
