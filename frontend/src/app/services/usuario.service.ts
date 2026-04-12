import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TipoMoeda, TipoUsuario, Usuario } from '../models/usuario.model';
import { UsuarioAuth } from '../models/usuario-auth.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private usuario$ = new BehaviorSubject<UsuarioAuth | null>(null);
  private usuarioObservable = this.usuario$.asObservable();

  constructor() {
    this.carregarUsuario();
  }

  private carregarUsuario(): void {
    const usuarioArmazenado = localStorage.getItem('usuarioLogado');
    if (usuarioArmazenado) {
      const usuario = JSON.parse(usuarioArmazenado);
      this.usuario$.next(usuario);
    }
  }

  getUsuario(): Observable<UsuarioAuth | null> {
    return this.usuarioObservable;
  }

  atualizarUsuario(usuarioAtualizado: UsuarioAuth): void {
    this.usuario$.next(usuarioAtualizado);
    localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
  }
}
