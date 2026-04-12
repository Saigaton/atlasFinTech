import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit {
  nome = '';
  email = '';
  senha = '';
  confirmarSenha = '';
  carregando = false;
  erro = '';
  sucesso = false;
  mostrarSenha = false;
  mostrarConfirmarSenha = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Se já estiver autenticado, redirecionar para dashboard
    if (this.authService.estaAutenticado()) {
      this.router.navigate(['/dashboard']);
    }
  }

  registro(): void {
    if (!this.nome || !this.email || !this.senha || !this.confirmarSenha) {
      this.erro = 'Preencha todos os campos';
      return;
    }

    if (this.senha !== this.confirmarSenha) {
      this.erro = 'As senhas não coincidem';
      return;
    }

    if (this.senha.length < 6) {
      this.erro = 'Senha deve ter pelo menos 6 caracteres';
      return;
    }

    if (!this.validarEmail(this.email)) {
      this.erro = 'Email inválido';
      return;
    }

    this.carregando = true;
    this.erro = '';

    this.authService.registroComSenha(this.nome, this.email, this.senha).subscribe({
      next: (response) => {
        this.carregando = false;
        this.sucesso = true;
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: (error) => {
        this.carregando = false;
        this.erro = error.message || 'Erro ao registrar';
      }
    });
  }

  irParaLogin(): void {
    this.router.navigate(['/login']);
  }

  toggleMostrarSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  toggleMostrarConfirmarSenha(): void {
    this.mostrarConfirmarSenha = !this.mostrarConfirmarSenha;
  }

  limparErro(): void {
    this.erro = '';
  }

  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
}
