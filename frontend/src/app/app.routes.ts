import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'contas',
    loadComponent: () => import('./pages/contas/contas.component').then(m => m.ContasComponent)
  },
  {
    path: 'transacoes',
    loadComponent: () => import('./pages/transacoes/transacoes.component').then(m => m.TransacoesComponent)
  },
  {
    path: 'contas-pagar',
    loadComponent: () => import('./pages/contas-pagar/contas-pagar.component').then(m => m.ContasPagarComponent)
  },
  {
    path: 'contas-receber',
    loadComponent: () => import('./pages/contas-receber/contas-receber.component').then(m => m.ContasReceberComponent)
  },
  {
    path: 'fluxo-caixa',
    loadComponent: () => import('./pages/fluxo-caixa/fluxo-caixa.component').then(m => m.FluxoCaixaComponent)
  },
  {
    path: 'analise',
    loadComponent: () => import('./pages/analise/analise.component').then(m => m.AnaliseComponent)
  },
  {
    path: 'relatorios',
    loadComponent: () => import('./pages/relatorios/relatorios.component').then(m => m.RelatoriosComponent)
  },
  {
    path: 'configuracoes',
    loadComponent: () => import('./pages/configuracoes/configuracoes.component').then(m => m.ConfiguracoesComponent)
  }
];
