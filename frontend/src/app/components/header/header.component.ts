import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
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
