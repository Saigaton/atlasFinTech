import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Usuario } from '../models/auth.models';

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
    const usuarioArmazenado = localStorage.getItem('usuarioLogado');
    if (usuarioArmazenado) {
      const usuario = JSON.parse(usuarioArmazenado);
      this.usuario$.next(usuario);
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
