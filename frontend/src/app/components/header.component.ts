import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../services/usuario.service';
import { Usuario } from '../models/usuario.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">{{ titulo }}</h1>
          <p class="date">{{ dataAtual }}</p>
        </div>
        <div class="header-right">
          <div class="user-info" *ngIf="usuario$ | async as usuario">
            <span class="user-name">{{ usuario?.nome }}</span>
            <div class="user-avatar">{{ getInitials(usuario?.nome || '') }}</div>
          </div>
        </div>
      </div>
    </header>
  `,
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  titulo = 'Dashboard';
  dataAtual = '';
  usuario$;

  constructor(private usuarioService: UsuarioService) {
    this.usuario$ = this.usuarioService.getUsuario();
  }

  ngOnInit(): void {
    this.atualizarData();
    setInterval(() => this.atualizarData(), 60000);
  }

  private atualizarData(): void {
    const agora = new Date();
    const opcoes: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    this.dataAtual = agora.toLocaleDateString('pt-BR', opcoes);
  }

  getInitials(nome: string): string {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
