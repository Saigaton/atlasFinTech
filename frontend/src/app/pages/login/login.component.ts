import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TipoMoeda, TipoUsuario, Usuario } from '../../models/usuario.model';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  email = '';
  senha = '';
  carregando = false;
  erro = '';
  mostrarSenha = false;

  private usuarioAtualSubject$ = new BehaviorSubject<Usuario | null>(null);
  public usuarioAtual = this.usuarioAtualSubject$.asObservable();

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Se já estiver autenticado, redirecionar para dashboard
    if (this.authService.estaAutenticado()) {
      this.router.navigate(['/dashboard']);
    }
  }

  login(): void {
    if (!this.email || !this.senha) {
      this.erro = 'Preencha email e senha';
      return;
    }

    this.carregando = true;
    this.erro = '';

    // começar a usar depois do backend
    this.authService.login(this.email, this.senha).subscribe({
      next: (response) => {
        this.carregando = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.carregando = false;
        this.erro = error.message || 'Erro ao fazer login';
      }
    });

  }

  irParaRegistro(): void {
    this.router.navigate(['/registro']);
  }

  toggleMostrarSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  limparErro(): void {
    this.erro = '';
  }
}
