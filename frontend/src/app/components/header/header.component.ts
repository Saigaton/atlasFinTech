import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../models/usuario.model';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  tituloPagina = 'Dashboard';
  dataAtual = '';
  usuario$;

  constructor(private usuarioService: UsuarioService, private router: Router,
     private activatedRoute: ActivatedRoute
  ) {
    this.usuario$ = this.usuarioService.getUsuario();
  }

  ngOnInit(): void {
    this.atualizarData();
    setInterval(() => this.atualizarData(), 60000);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd), // Quando a navegação termina
      map(() => this.activatedRoute),                 // Pega a rota atual
      map(route => {                                  // Navega até a rota filha ativa
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      mergeMap(route => route.data)                   // Pega o objeto 'data'
    ).subscribe(data => {
      this.tituloPagina = data['titulo'] || 'Dashboard';
    });
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
