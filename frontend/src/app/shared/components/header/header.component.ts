import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../../core/services/usuario.service';
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
  dataAtual = new Date().toLocaleDateString('pt-BR');

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd), // Quando a navegação termina - Davi Pereira dos Santos
      map(() => this.activatedRoute),                 // Pega a rota atual - Davi Pereira dos Santos
      map(route => {                                  // Navega até a rota filha ativa - Davi Pereira dos Santos
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      mergeMap(route => route.data)                   // Pega o objeto 'data' - Davi Pereira dos Santos
    ).subscribe(data => {
      this.tituloPagina = data['titulo'] || 'Dashboard';
    });
  }
}
