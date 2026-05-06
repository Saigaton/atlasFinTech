import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { filter, map, startWith } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { combineLatest, Observable } from 'rxjs';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ToastComponent],
  templateUrl: './app.html',
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

    // const usuarioLogado$ = this.authService.usuarioAtual$.pipe(
    //   map(user => !!user)
    // );

    // this.exibirLayout$ = combineLatest([eRotaPublica$, usuarioLogado$]).pipe(
    //   map(([ePublica, logado]) => !ePublica && logado)
    // );
  }
}