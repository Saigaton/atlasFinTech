import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AnaliseService } from '../../core/services/analise.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { ShellComponent } from '../../shared/components/shell/shell.component';
import {
  Alerta, AnaliseFinanceira, DadosCalendario, DadosFluxoCaixa,
  EventoCalendario, TipoAlerta,
} from '../../core/models/analise.model';

type AbaAtiva      = 'fluxoCaixa' | 'analise' | 'alertas' | 'assistente' | 'calendario';
type PeriodoAnalise = '1m' | '3m' | '6m' | '1y';

@Component({
  selector: 'app-analise',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ShellComponent],
  templateUrl: './analise.component.html',
  styleUrls: ['./analise.component.scss', './analise.component.extra.scss']
})
export class AnaliseComponent implements OnInit {

  // ── Aba ───────────────────────────────────────────────────────────────
  abaSelecionada: AbaAtiva = 'fluxoCaixa';

  // ── Fluxo de Caixa ────────────────────────────────────────────────────
  carregandoFluxoCaixa = true;
  fluxoCaixa: DadosFluxoCaixa | null = null;

  // ── Análise Financeira ────────────────────────────────────────────────
  carregandoAnalise = true;
  analise: AnaliseFinanceira | null = null;

  hoje  = new Date();
  meses = [
    {v:1,l:'Jan'},{v:2,l:'Fev'},{v:3,l:'Mar'},{v:4,l:'Abr'},
    {v:5,l:'Mai'},{v:6,l:'Jun'},{v:7,l:'Jul'},{v:8,l:'Ago'},
    {v:9,l:'Set'},{v:10,l:'Out'},{v:11,l:'Nov'},{v:12,l:'Dez'},
  ];
  anos = Array.from({ length: 3 }, (_, i) => this.hoje.getFullYear() - i);

  mesSelecionado    = this.hoje.getMonth() + 1;
  anoSelecionado    = this.hoje.getFullYear();
  periodoAnalise: PeriodoAnalise = '1m';

  // ── Alertas ───────────────────────────────────────────────────────────
  readonly TipoAlerta = TipoAlerta;
  carregandoAlertas = true;
  alertas: Alerta[] = [];

  // ── Calendário ────────────────────────────────────────────────────────
  carregandoCalendario = true;
  dadosCalendario: DadosCalendario | null = null;
  mesSelecionadoCal = new Date().getMonth() + 1;
  anoSelecionadoCal = new Date().getFullYear();

  // ── Chatbot ───────────────────────────────────────────────────────────
  mensagemChat = '';
  enviandoChat = false;
  historicoChat: { tipo: 'usuario' | 'bot'; texto: string }[] = [
    { tipo: 'bot', texto: 'Olá! Sou o assistente financeiro do Atlas FinTech. Como posso ajudar?' },
  ];

  constructor(
    private empresaService: EmpresaService,
    private analiseService: AnaliseService,
  ) {}

  private get empresaId(): number | null {
    return this.empresaService.ativoId();
  }

  ngOnInit(): void {
    this._carregarFluxoCaixa();
    this._carregarAlertas();
  }

  // ── Carregadores ──────────────────────────────────────────────────────

  private _carregarFluxoCaixa(): void {
    const id = this.empresaId;
    if (!id) { this.carregandoFluxoCaixa = false; return; }
    this.carregandoFluxoCaixa = true;
    this.analiseService.obterFluxoCaixa(id, 4).subscribe({
      next: r  => { this.fluxoCaixa = r.conteudo; this.carregandoFluxoCaixa = false; },
      error: () => { this.carregandoFluxoCaixa = false; },
    });
  }

  private _carregarAnalise(): void {
    const id = this.empresaId;
    if (!id) { this.carregandoAnalise = false; return; }
    this.carregandoAnalise = true;
    const m = this.mesSelecionado > 0 ? this.mesSelecionado : undefined;
    this.analiseService.obterAnaliseFinanceira(id, m, this.anoSelecionado).subscribe({
      next: r  => { this.analise = r.conteudo; this.carregandoAnalise = false; },
      error: () => { this.carregandoAnalise = false; },
    });
  }

  private _carregarAlertas(): void {
    const id = this.empresaId;
    if (!id) { this.carregandoAlertas = false; return; }
    this.analiseService.obterAlertas(id).subscribe({
      next: r  => { this.alertas = r.conteudo ?? []; this.carregandoAlertas = false; },
      error: () => { this.carregandoAlertas = false; },
    });
  }

  private _carregarCalendario(): void {
    const id = this.empresaId;
    if (!id) { this.carregandoCalendario = false; return; }
    this.carregandoCalendario = true;
    this.analiseService.obterCalendario(id, this.mesSelecionadoCal, this.anoSelecionadoCal).subscribe({
      next: r  => { this.dadosCalendario = r.conteudo; this.carregandoCalendario = false; },
      error: () => { this.carregandoCalendario = false; },
    });
  }

  // ── Navegação ─────────────────────────────────────────────────────────

  selecionarAba(aba: AbaAtiva): void {
    this.abaSelecionada = aba;
    if (aba === 'analise'    && !this.analise)         this._carregarAnalise();
    if (aba === 'alertas')                              this._carregarAlertas();
    if (aba === 'calendario' && !this.dadosCalendario) this._carregarCalendario();
  }

  definirPeriodoAnalise(periodo: PeriodoAnalise): void {
    this.periodoAnalise = periodo;
    const agora = new Date();
    if (periodo === '1m') {
      this.mesSelecionado = agora.getMonth() + 1;
      this.anoSelecionado = agora.getFullYear();
    } else {
      this.mesSelecionado = 0;
      this.anoSelecionado = agora.getFullYear();
    }
    this._carregarAnalise();
  }

  alterarMesCalendario(): void {
    this.dadosCalendario = null;
    this._carregarCalendario();
  }

  // ── Chatbot ───────────────────────────────────────────────────────────

  enviarMensagem(): void {
    const msg = this.mensagemChat.trim();
    if (!msg) return;
    const id = this.empresaId;
    if (!id) return;

    this.historicoChat = [...this.historicoChat, { tipo: 'usuario', texto: msg }];
    this.mensagemChat  = '';
    this.enviandoChat  = true;

    this.analiseService.enviarMensagemChat(id, msg).subscribe({
      next: r => {
        this.historicoChat = [...this.historicoChat, { tipo: 'bot', texto: r.conteudo.resposta }];
        this.enviandoChat  = false;
      },
      error: () => {
        this.historicoChat = [...this.historicoChat,
          { tipo: 'bot', texto: 'Desculpe, ocorreu um erro. Tente novamente.' }];
        this.enviandoChat = false;
      },
    });
  }

  aoDigitarChat(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.enviarMensagem(); }
  }

  sugestaoRapida(q: string): void {
    this.mensagemChat = q;
    this.enviarMensagem();
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  formatarMoeda(v: number | null | undefined): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
  }

  formatarPorcentagem(v: number | null | undefined): string {
    if (v == null) return '—';
    return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
  }

  formatarDataHora(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR');
  }

  iconeAlerta(tipo: TipoAlerta): string {
    return ({
      [TipoAlerta.Perigo]:    '🔴',
      [TipoAlerta.Aviso]:     '🟡',
      [TipoAlerta.Informacao]:'🔵',
    } as Record<number, string>)[tipo] ?? '⚪';
  }


  get maxBarraCaixa(): number {
    const d = this.fluxoCaixa?.projecao ?? [];
    return Math.max(...d.map(m => Math.max(Number(m.receitaProjetada), Number(m.despesaProjetada))), 1);
  }

  alturaBarraCaixa(val: number): string {
    const n = Number(val) || 0;
    return Math.max((n / this.maxBarraCaixa) * 100, n > 0 ? 4 : 0).toFixed(1) + '%';
  }

  // ── Helpers calendário ────────────────────────────────────────────────

  diasCalendario(): (number | null)[] {
    if (!this.dadosCalendario) return [];
    const vazios = Array(this.dadosCalendario.primeiroDiaSemana).fill(null);
    const dias   = Array.from({ length: this.dadosCalendario.diasNoMes }, (_, i) => i + 1);
    return [...vazios, ...dias];
  }

  eventoDoCalendario(dia: number): EventoCalendario | undefined {
    if (!this.dadosCalendario) return undefined;
    const { ano: a, mes: m } = this.dadosCalendario;
    const ms = String(m).padStart(2, '0');
    const ds = String(dia).padStart(2, '0');
    return (this.dadosCalendario.eventos ?? []).find(e => e.data === `${a}-${ms}-${ds}`);
  }

  ehHoje(dia: number): boolean {
    if (!this.dadosCalendario) return false;
    const t = new Date();
    return t.getFullYear() === this.dadosCalendario.ano
        && t.getMonth() + 1 === this.dadosCalendario.mes
        && t.getDate()       === dia;
  }

}
