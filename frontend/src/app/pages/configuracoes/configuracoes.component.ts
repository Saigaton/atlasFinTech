import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../models/usuario.model';
import { UsuarioAuth } from '../../models/usuario-auth.model';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracoes.component.html',
  styleUrl: './configuracoes.component.css'
})
export class ConfiguracoesComponent implements OnInit {
  usuario: UsuarioAuth | null = null;
  usuarioEditado: UsuarioAuth | null = null;
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
