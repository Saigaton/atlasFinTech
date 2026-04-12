import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoginResponse, UsuarioAuth } from '../models/usuario-auth.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioAtualSubject = new BehaviorSubject<UsuarioAuth | null>(null);
  public usuarioAtual$ = this.usuarioAtualSubject.asObservable();

  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  private usuariosRegistradosTeste: UsuarioAuth[] = [
    // Usuário padrão de demonstração
      {
        id: '1',
        nome: 'Usuário Demo',
        email: 'demo@example.com',
        senha: 'demo123',
        dataCriacao: new Date(),
        ativo: true
      }
  ];

  constructor(private router: Router) {
    this.carregarDados();
    this.verificarSessao();
    this.usuarioAtualSubject.subscribe(usuario => {
      if (!usuario) {
        this.router.navigate(['/login']);
      }
    });
  }

  private carregarDados(): void {
    const usuariosArmazenados = localStorage.getItem('usuarios');
    if (usuariosArmazenados) {
      this.usuariosRegistradosTeste = JSON.parse(usuariosArmazenados);
    }

    const usuarioLogado = localStorage.getItem('usuarioLogado');
    const tokenArmazenado = localStorage.getItem('token');
    if (usuarioLogado && tokenArmazenado) {
      this.usuarioAtualSubject.next(JSON.parse(usuarioLogado));
      this.tokenSubject.next(tokenArmazenado);
    }
  }

  private verificarSessao(): void {
    const token = localStorage.getItem('token');
    if (token) {
      const usuarioLogado = localStorage.getItem('usuarioLogado');
      if (usuarioLogado) {
        this.usuarioAtualSubject.next(JSON.parse(usuarioLogado));
        this.tokenSubject.next(token);
      }
    }
  }

  registro(nome: string, email: string, senha: string): Observable<LoginResponse> {
    return new Observable(observer => {
      setTimeout(() => {
        // Verificar se email já existe
        if (this.usuariosRegistradosTeste.some(u => u.email === email)) {
          observer.error({ message: 'Email já registrado' });
          return;
        }

        // Validações
        if (!nome || !email || !senha) {
          observer.error({ message: 'Preencha todos os campos' });
          return;
        }

        if (senha.length < 6) {
          observer.error({ message: 'Senha deve ter pelo menos 6 caracteres' });
          return;
        }

        // Criar novo usuário
        const novoUsuario: UsuarioAuth = {
          id: this.gerarId(),
          nome,
          email,
          dataCriacao: new Date(),
          ativo: true
        };

        this.usuariosRegistradosTeste.push(novoUsuario);
        localStorage.setItem('usuarios', JSON.stringify(this.usuariosRegistradosTeste));

        // Gerar token
        const token = this.gerarToken();

        // Armazenar sessão
        localStorage.setItem('usuarioLogado', JSON.stringify(novoUsuario));
        localStorage.setItem('token', token);

        this.usuarioAtualSubject.next(novoUsuario);
        this.tokenSubject.next(token);

        observer.next({
          usuario: novoUsuario,
          token
        });
        observer.complete();
      }, 1000);
    });
  }

  login(email: string, senha: string): Observable<LoginResponse> {
    return new Observable(observer => {
      setTimeout(() => {
        // Validações
        if (!email || !senha) {
          observer.error({ message: 'Email e senha são obrigatórios' });
          return;
        }

        // Buscar usuário
        const usuario = this.usuariosRegistradosTeste.find(u => u.email === email);
        if (!usuario) {
          observer.error({ message: 'Email não encontrado' });
          return;
        }

        // Verificar senha (em produção, usar hash)
        const usuarioComSenha = this.usuariosRegistradosTeste.find(u => u.email === email && u.senha === senha);
        if (!usuarioComSenha) {
          observer.error({ message: 'Senha incorreta' });
          return;
        }

        // Gerar token
        const token = this.gerarToken();

        // Armazenar sessão
        localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
        localStorage.setItem('token', token);

        this.usuarioAtualSubject.next(usuario);
        this.tokenSubject.next(token);

        observer.next({
          usuario,
          token
        });
        observer.complete();
      }, 1000);
    });
  }

  logout(): void {
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('token');
    this.usuarioAtualSubject.next(null);
    this.tokenSubject.next(null);
    // this.router.navigate(['/login']);
  }

  estaAutenticado(): boolean {
    return !!localStorage.getItem('token');
  }

  obterUsuarioAtual(): UsuarioAuth | null {
    return this.usuarioAtualSubject.value;
  }

  obterToken(): string | null {
    return localStorage.getItem('token');
  }

  private gerarId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private gerarToken(): string {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
  }

  // Método auxiliar para salvar senha (apenas para demo)
  private salvarSenha(email: string, senha: string): void {
    const usuario = this.usuariosRegistradosTeste.find(u => u.email === email);
    if (usuario) {
      usuario.senha = senha;
      localStorage.setItem('usuarios', JSON.stringify(this.usuariosRegistradosTeste));
    }
  }

  // Sobrescrever método de registro para salvar senha
  registroComSenha(nome: string, email: string, senha: string): Observable<LoginResponse> {
    return new Observable(observer => {
      setTimeout(() => {
        if (this.usuariosRegistradosTeste.some(u => u.email === email)) {
          observer.error({ message: 'Email já registrado' });
          return;
        }

        if (!nome || !email || !senha) {
          observer.error({ message: 'Preencha todos os campos' });
          return;
        }

        if (senha.length < 6) {
          observer.error({ message: 'Senha deve ter pelo menos 6 caracteres' });
          return;
        }

        const novoUsuario: UsuarioAuth = {
          id: this.gerarId(),
          nome,
          email,
          senha, // Armazenar senha (apenas para demo, não fazer em produção)
          dataCriacao: new Date(),
          ativo: true
        };

        this.usuariosRegistradosTeste.push(novoUsuario);
        localStorage.setItem('usuarios', JSON.stringify(this.usuariosRegistradosTeste));

        const token = this.gerarToken();
        localStorage.setItem('usuarioLogado', JSON.stringify(novoUsuario));
        localStorage.setItem('token', token);

        this.usuarioAtualSubject.next(novoUsuario);
        this.tokenSubject.next(token);

        observer.next({
          usuario: novoUsuario,
          token
        });
        observer.complete();
      }, 1000);
    });
  }
}
