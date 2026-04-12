import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { AuthService } from './services/auth.service';
import { filter, map, startWith } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { combineLatest, Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  exibirLayout$!: Observable<boolean>;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const eRotaPublica$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => {
        const url = this.router.url;
        return url.startsWith('/login') || url.startsWith('/registro');
      })
    );

    const usuarioLogado$ = this.authService.usuarioAtual$.pipe(
      map(user => !!user)
    );

    this.exibirLayout$ = combineLatest([eRotaPublica$, usuarioLogado$]).pipe(
      map(([ePublica, logado]) => !ePublica && logado)
    );
  }
}