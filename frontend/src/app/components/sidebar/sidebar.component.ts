import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  usuario$;

  constructor(private usuarioService: UsuarioService, private authService: AuthService){
    this.usuario$ = this.usuarioService.getUsuario();
  }

  toggleSidebar(): void {
    // Implementar lógica de toggle se necessário
  }

  logout(){
    this.authService.logout();
  }

}
