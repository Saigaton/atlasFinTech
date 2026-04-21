import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../core/services/usuario.service';
import { Usuario } from '../../core/models/auth.models';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracoes.component.html',
  styleUrl: './configuracoes.component.css'
})
export class ConfiguracoesComponent implements OnInit {
  usuario: Usuario | null = null;
  usuarioEditado: Usuario | null = null;
  editando = false;

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.usuarioService.getUsuario().subscribe(usuario => {
      this.usuario = usuario;
      if (usuario) {
        this.usuarioEditado = { ...usuario };
      }
    });
  }

  iniciarEdicao(): void {
    this.editando = true;
    if (this.usuario) {
      this.usuarioEditado = { ...this.usuario };
    }
  }

  cancelarEdicao(): void {
    this.editando = false;
    if (this.usuario) {
      this.usuarioEditado = { ...this.usuario };
    }
  }

  salvarAlteracoes(): void {
    if (this.usuarioEditado) {
      this.usuarioService.atualizarUsuario(this.usuarioEditado);
      this.usuario = { ...this.usuarioEditado };
      this.editando = false;
      alert('Configurações atualizadas com sucesso!');
    }
  }

  sairDasTodas(): void {
    if (confirm('Tem certeza que deseja sair de todas as sessões?')) {
      alert('Você foi desconectado de todas as sessões.');
    }
  }
}
