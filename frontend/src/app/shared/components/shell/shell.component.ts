/**
 * Shell (Layout Principal) — Atlas FinTech.
 *
 * Componente de layout que envolve todas as telas autenticadas.
 * Fornece a sidebar de navegação com grupos, topbar com usuário/tema e área de conteúdo.
 *
 * Navegação em 4 grupos (padrão SGFE):
 *   Principal  → Dashboard
 *   Financeiro → Contas Bancárias, Transações, A Pagar, A Receber, Fluxo de Caixa
 *   Análise    → Análise Financeira, Relatórios, Categorias
 *   IA         → Assistente IA  (badge "IA" via .nav-item-ai quando inativo)
 *
 * Logout:
 *   1. company.clearActive() — limpa a empresa ativa do localStorage
 *   2. auth.logout()         — invalida o refresh token no servidor e limpa tokens
 *   Ordem é importante: company deve ser limpa ANTES do logout do auth.
 */
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { UnsubscriberComponent } from '../../../core/unsubscriber.component';
import { EmpresaService } from '../../../core/services/empresa.service';

/**
 * Shell do sistema autenticado — Atlas FinTech.
 *
 * Estrutura: sidebar fixa com navGroups + topbar + conteúdo (ng-content).
 * Usado por todas as 10 telas autenticadas (Dashboard, Transações, Contas,
 * Categorias, A Pagar, A Receber, Analytics, Reports, Fluxo de Caixa, Assistente IA).
 * A sidebar colapsa para ícones em tablets e vai para off-canvas em mobile.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ThemeToggleComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent extends UnsubscriberComponent implements OnInit {

  // ── Estado ───────────────────────────────────────────────────────────────
  collapsed  = false;
  mobileOpen = false;
  iniciaisUsuario   = '';
  nomeUsuario  = '';
  emailUsuario  = '';
  tituloPagina  = 'Atlas FinTech';

  // ── Navegação ────────────────────────────────────────────────────────────
  readonly navGroups = [
    {
      label: 'Principal',
      items: [
        { icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z', label: 'Dashboard', route: '/dashboard' },
      ]
    },
    {
      label: 'Financeiro',
      items: [
        { icon: 'M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14c1.1 0 2 .9 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z', label: 'Contas Bancárias', route: '/contas' },
        { icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z', label: 'Transações', route: '/transacoes' },
        { icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 9H7v-2h7v2zm-1-4H7V7h6v2zm5 8H7v-2h10v2z', label: 'Contas a Pagar', route: '/contas-pagar' },
        { icon: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z', label: 'Contas a Receber', route: '/contas-receber' },
        { icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z', label: 'Fluxo de Caixa', route: '/fluxo-caixa' },
      ]
    },
    {
      label: 'Análise',
      items: [
        { icon: 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z', label: 'Análise Financeira', route: '/analise' },
        { icon: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z', label: 'Relatórios', route: '/relatorios' },
        { icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', label: 'Categorias', route: '/categories' },
      ]
    },
    {
      label: 'IA',
      items: [
        { icon: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z', label: 'Assistente IA', route: '/chatbot' },
      ]
    },
    {
      label: 'Conta',
      items: [
        { icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z', label: 'Meu Perfil', route: '/configuracoes' },
      ]
    },
  ];

  readonly navItems = this.navGroups.flatMap(g => g.items);

  constructor(
    protected auth:    AuthService,
    protected empresaService: EmpresaService,
    protected router:  Router,
  ) {
    super();
  }

  ngOnInit(): void {
    // Dados do usuário
    this.iniciaisUsuario  = this.auth.getIniciaisUsuario();
    this.nomeUsuario = this.auth.getNomeUsuario();
    this.emailUsuario = this.auth.getEmailUsuario();

    // Título da página — reage a cada NavigationEnd
    this._subscriptions.push(
      this.router.events.pipe(
        filter(e => e instanceof NavigationEnd),
        map(e => (e as NavigationEnd).urlAfterRedirects.split('?')[0]),
        startWith(this.router.url.split('?')[0]),
      ).subscribe(url => {
        const item    = this.navItems.find(i => url.startsWith(i.route));
        this.tituloPagina = item?.label ?? 'Atlas FinTech';
      })
    );
  }

  toggleCollapse(): void { this.collapsed  = !this.collapsed; }
  toggleMobile():   void { this.mobileOpen = !this.mobileOpen; }
  closeMobile():    void { this.mobileOpen = false; }

  logout(): void {
    this.empresaService.limparAtivo();
    this.auth.logout();
  }
}