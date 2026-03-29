import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private usuario$ = new BehaviorSubject<Usuario | null>(null);
  private usuarioObservable = this.usuario$.asObservable();

  constructor() {
    this.carregarUsuario();
  }

  private carregarUsuario(): void {
    const usuarioArmazenado = localStorage.getItem('usuario');
    if (usuarioArmazenado) {
      const usuario = JSON.parse(usuarioArmazenado);
      this.usuario$.next(usuario);
    } else {
      // Usuário padrão de demonstração
      const usuarioPadrao: Usuario = {
        id: '1',
        nome: 'Usuário Demo',
        email: 'demo@example.com',
        tipoConta: 'Usuário',
        moedaPadrao: 'BRL',
        formatoData: 'DD/MM/YYYY',
        fusoHorario: 'GMT-3'
      };
      this.usuario$.next(usuarioPadrao);
      localStorage.setItem('usuario', JSON.stringify(usuarioPadrao));
    }
  }

  getUsuario(): Observable<Usuario | null> {
    return this.usuarioObservable;
  }

  atualizarUsuario(usuarioAtualizado: Usuario): void {
    this.usuario$.next(usuarioAtualizado);
    localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
  }
}
