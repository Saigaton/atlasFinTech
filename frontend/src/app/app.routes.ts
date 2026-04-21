import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro.component').then(m => m.RegistroComponent)
  },
  {
    path: 'recuperar-senha',
    loadComponent: () =>
      import('./pages/recuperar-senha/recuperar-senha.component').then(m => m.RecuperarSenhaComponent),
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { titulo: 'Dashboard' }
      },
      {
        path: 'contas',
        loadComponent: () => import('./pages/contas/contas.component').then(m => m.ContasComponent),
        data: { titulo: 'Contas' }
      },
      {
        path: 'transacoes',
        loadComponent: () => import('./pages/transacoes/transacoes.component').then(m => m.TransacoesComponent),
        data: { titulo: 'Transações' }
      },
      {
        path: 'contas-pagar',
        loadComponent: () => import('./pages/contas-pagar/contas-pagar.component').then(m => m.ContasPagarComponent),
        data: { titulo: 'Contas a Pagar' }
      },
      {
        path: 'contas-receber',
        loadComponent: () => import('./pages/contas-receber/contas-receber.component').then(m => m.ContasReceberComponent),
        data: { titulo: 'Contas a Receber' }
      },
      {
        path: 'fluxo-caixa',
        loadComponent: () => import('./pages/fluxo-caixa/fluxo-caixa.component').then(m => m.FluxoCaixaComponent),
        data: { titulo: 'Fluxo de Caixa' }
      },
      {
        path: 'analise',
        loadComponent: () => import('./pages/analise/analise.component').then(m => m.AnaliseComponent),
        data: { titulo: 'Análise' }
      },
      {
        path: 'relatorios',
        loadComponent: () => import('./pages/relatorios/relatorios.component').then(m => m.RelatoriosComponent),
        data: { titulo: 'Relatórios' }
      },
      {
        path: 'configuracoes',
        loadComponent: () => import('./pages/configuracoes/configuracoes.component').then(m => m.ConfiguracoesComponent),
        data: { titulo: 'Configurações' }
      }
    ]
  }
];
