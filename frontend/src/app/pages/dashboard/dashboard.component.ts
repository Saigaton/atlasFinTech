import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EmpresaService } from '../../core/services/empresa.service';
import { TransacaoService } from '../../core/services/transacao.service';
import { ContaService } from '../../core/services/conta.service';
import { AnaliseService } from '../../core/services/analise.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { ContaPagarService } from '../../core/services/conta-pagar.service';
import { ContaReceberService } from '../../core/services/conta-receber.service';
import { ToastService } from '../../core/services/toast.service';
import { ShellComponent } from '../../shared/components/shell/shell.component';
import {
  DashboardKPI, MesGrafico,
  PontoCategoria, PrevisaoMes, SegmentoDonut,
} from '../../core/models/dashboard.models';
import { Transacao, TipoTransacao, SituacaoTransacao } from '../../core/models/transacao.model';
import { Conta } from '../../core/models/conta.model';
import { Categoria } from '../../core/models/categoria.models';
import { handleApiError } from '../../core/handlers/handle-api-error';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ShellComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss', './dashboard.component.extra.scss'],
})
export class DashboardComponent implements OnInit {

  // ── Estado de carregamento ───────────────────────────────────────────────
  temEmpresa           = false;
  carregandoKpis       = true;
  carregandoTransacoes = true;
  carregandoContas     = true;
  carregandoGrafico    = true;
  carregandoCategorias = true;

  // ── Dados ────────────────────────────────────────────────────────────────
  kpis:                  DashboardKPI | null  = null;
  transacoes:            Transacao[]          = [];
  contas:                Conta[]              = [];
  dadosGrafico:          MesGrafico[]         = [];
  despesasCategorias:    PontoCategoria[]     = [];
  receitasCategorias:    PontoCategoria[]     = [];
  previsaoMes:           PrevisaoMes | null   = null;
  segmentosDonut:        SegmentoDonut[]      = [];
  segmentosDonutReceita: SegmentoDonut[]      = [];

  readonly hoje = new Date();
  mesSelecionado              = this.hoje.getMonth() + 1;
  anoSelecionado              = this.hoje.getFullYear();
  periodoSelecionado: 'mes' | 'ultimos30' | 'ano' = 'mes';

  contasVencidasCount        = 0;
  contasVencidasTotal        = 0;
  vencimentoBreveCount       = 0;
  vencimentoBreveTotal       = 0;
  recebimentosAtrasadosCount = 0;
  recebimentosAtrasadosTotal = 0;

  readonly TipoTransacao     = TipoTransacao;
  readonly SituacaoTransacao = SituacaoTransacao;
  readonly ROTULOS_MESES     = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  constructor(
    private empresaService:      EmpresaService,
    private transacaoService:    TransacaoService,
    private contaService:        ContaService,
    private analiseService:      AnaliseService,
    private categoriaService:    CategoriaService,
    private contaPagarService:   ContaPagarService,
    private contaReceberService: ContaReceberService,
    private toast:               ToastService,
  ) {}

  ngOnInit(): void {
    this.empresaService.listarEmpresas().pipe(
      handleApiError(this.toast, 'Erro ao carregar dados da empresa.')
    ).subscribe({
      next: empresas => {
        if (empresas.length > 0) {
          this.temEmpresa = true;
          this._carregarTudo();
        } else {
          this.temEmpresa = false;
          this._pararCarregamentos();
        }
      },
      error: () => {
        this.temEmpresa = false;
        this._pararCarregamentos();
      },
    });
  }

  private _pararCarregamentos(): void {
    this.carregandoKpis = this.carregandoTransacoes = this.carregandoContas =
    this.carregandoGrafico = this.carregandoCategorias = false;
  }

  private _carregarTudo(): void {
    const id = this.empresaService.ativoId();
    if (!id) return;
    this._carregarKpis(id);
    this._carregarTransacoes(id);
    this._carregarContas(id);
    this._carregarGrafico(id); // aqui
    this._carregarAlertasCards(id);
    this._carregarCategorias(id);
    this._carregarPrevisaoMes(id);
  }

  private _carregarKpis(id: number): void {
    this.carregandoKpis = true;
    const mes = this.periodoSelecionado === 'ano' ? undefined : this.mesSelecionado;
    this.transacaoService.obterKpis(id, mes, this.anoSelecionado).pipe(
      handleApiError(this.toast, 'Erro ao carregar KPIs.')
    ).subscribe({
      next: r => { this.kpis = r; this.carregandoKpis = false; },
      error: ()  => { this.carregandoKpis = false; },
    });
  }

  private _carregarTransacoes(id: number): void {
    this.carregandoTransacoes = true;
    this.transacaoService.obterTransacoesRecente(id, 3).pipe(
      handleApiError(this.toast, 'Erro ao carregar transações recentes.')
    ).subscribe({
      next: r => { this.transacoes = r ?? []; this.carregandoTransacoes = false; },
      error: ()  => { this.carregandoTransacoes = false; },
    });
  }

  private _carregarContas(id: number): void {
    this.carregandoContas = true;
    this.contaService.listarContas(id).pipe(
      handleApiError(this.toast, 'Erro ao carregar contas.')
    ).subscribe({
      next: r => { this.contas = r ?? []; this.carregandoContas = false; },
      error: ()  => { this.carregandoContas = false; },
    });
  }

  private _carregarGrafico(id: number): void {
    this.carregandoGrafico = true;
    this.transacaoService.obterMesGrafico(id, this.anoSelecionado).pipe(
      handleApiError(this.toast, 'Erro ao carregar gráfico.')
    ).subscribe({
      next: r => { this.dadosGrafico = r ?? []; this.carregandoGrafico = false; },
      error: ()  => { this.carregandoGrafico = false; },
    });
  }

  private _carregarAlertasCards(id: number): void {
    const hoje    = new Date();
    const em7dias = new Date(hoje);
    em7dias.setDate(hoje.getDate() + 7);
    const fmtData = (d: Date) => d.toISOString().split('T')[0];

    this.contaPagarService.listarContasPagar(id, { status: '2', per_page: 100 }).pipe(
      handleApiError(this.toast, 'Erro ao carregar contas vencidas.')
    ).subscribe({
      next: r => {
        const lista = r.conteudo ?? [];
        this.contasVencidasCount = lista.length;
        this.contasVencidasTotal = lista.reduce((s, i) => s + (Number(i.valor) || 0), 0);
      },
    });

    this.contaPagarService.listarContasPagar(id, { status: '0', date_to: fmtData(em7dias), per_page: 100 }).pipe(
      handleApiError(this.toast, 'Erro ao carregar vencimentos próximos.')
    ).subscribe({
      next: r => {
        const lista = r.conteudo ?? [];
        this.vencimentoBreveCount = lista.length;
        this.vencimentoBreveTotal = lista.reduce((s, i) => s + (Number(i.valor) || 0), 0);
      },
    });

    this.contaReceberService.listarContasReceber(id, { status: '2', per_page: 100 }).pipe(
      handleApiError(this.toast, 'Erro ao carregar recebimentos atrasados.')
    ).subscribe({
      next: r => {
        const lista = r.conteudo ?? [];
        this.recebimentosAtrasadosCount = lista.length;
        this.recebimentosAtrasadosTotal = lista.reduce((s, i) => s + (Number(i.valor) || 0), 0);
      },
    });
  }

  private async _carregarCategorias(id: number): Promise<void> {
    this.carregandoCategorias = true;
    const PALETA = ['#ef4444','#f97316','#eab308','#84cc16','#06b6d4',
                    '#8b5cf6','#ec4899','#14b8a6','#f59e0b','#6366f1'];
    try {
      const mes = this.periodoSelecionado === 'ano' ? undefined : this.mesSelecionado;
      const [catResp, analiseResp] = await Promise.all([
        firstValueFrom(this.categoriaService.listarCategoria(id)),
        firstValueFrom(this.analiseService.obterAnaliseFinanceira(id, mes, this.anoSelecionado)),
      ]);

      const mapa = new Map<number, Categoria>();
      (catResp ?? []).forEach((c: Categoria) => mapa.set(c.id, c));

      const dados = analiseResp as any;
      const principaisDespesas: any[] = dados?.principaisDespesasCategorias ?? dados?.top_expense_categories ?? [];
      const totalDespesa: number      = dados?.totalDespesa ?? dados?.total_expense ?? 0;
      const principaisReceitas: any[] = dados?.principaisReceitasCategorias ?? dados?.top_income_categories ?? [];
      const totalReceita: number      = dados?.totalReceita ?? dados?.total_income ?? 0;

      this.despesasCategorias = principaisDespesas
        .filter((c: any) => c.total != null && !isNaN(Number(c.total)) && Number(c.total) !== 0)
        .slice(0, 3)
        .map((c: any, i: number): PontoCategoria => {
          const catId = c.categoriaId ?? c.category_id ?? null;
          const cat   = catId != null ? mapa.get(catId) : null;
          const total = Number(c.total);
          return {
            nome:        cat?.nome ?? (catId != null ? `Cat. #${catId}` : 'Sem categoria'),
            cor:         cat?.cor  ?? PALETA[i % PALETA.length],
            total,
            percentual:  totalDespesa !== 0 ? Math.abs(total / totalDespesa) * 100 : 0,
            categoriaId: catId,
          };
        });

      this.receitasCategorias = principaisReceitas
        .filter((c: any) => c.total != null && !isNaN(Number(c.total)) && Number(c.total) !== 0)
        .slice(0, 3)
        .map((c: any, i: number): PontoCategoria => {
          const catId = c.categoriaId ?? c.category_id ?? null;
          const cat   = catId != null ? mapa.get(catId) : null;
          const total = Number(c.total);
          return {
            nome:        cat?.nome ?? (catId != null ? `Cat. #${catId}` : 'Sem categoria'),
            cor:         cat?.cor  ?? ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#06b6d4'][i % 5],
            total,
            percentual:  totalReceita !== 0 ? Math.abs(total / totalReceita) * 100 : 0,
            categoriaId: catId,
          };
        });

      this._atualizarSegmentosDonut();
      this._atualizarSegmentosDonutReceita();
    } catch {
      this.toast.error('Não foi possível carregar o gráfico de categorias.');
      this.despesasCategorias = [];
      this.receitasCategorias = [];
    } finally {
      this.carregandoCategorias = false;
    }
  }

  private _atualizarSegmentosDonut(): void {
    const CIRC = 219.91;
    let offset = CIRC * 0.25;
    this.segmentosDonut = this.despesasCategorias.map(cat => {
      const dash = (cat.percentual / 100) * CIRC;
      const gap  = CIRC - dash;
      const seg: SegmentoDonut = { nome: cat.nome, cor: cat.cor, dash, gap, offset };
      offset -= dash;
      return seg;
    });
  }

  private _atualizarSegmentosDonutReceita(): void {
    const CIRC = 219.91;
    let offset = CIRC * 0.25;
    this.segmentosDonutReceita = this.receitasCategorias.map(cat => {
      const dash = (cat.percentual / 100) * CIRC;
      const gap  = CIRC - dash;
      const seg: SegmentoDonut = { nome: cat.nome, cor: cat.cor, dash, gap, offset };
      offset -= dash;
      return seg;
    });
  }

  private async _carregarPrevisaoMes(id: number): Promise<void> {
    try {
      const res  = await firstValueFrom(this.analiseService.obterPrevisaoMes(id));
      const dado = res as any;
      if (!dado) { this.previsaoMes = null; return; }
      this.previsaoMes = {
        ePositivo:        dado.is_positive      ?? dado.ePositivo        ?? true,
        saldoProjetado:   dado.projected_balance ?? dado.saldoProjetado   ?? 0,
        receitaProjetada: dado.projected_income  ?? dado.receitaProjetada ?? 0,
        despesaProjetada: dado.projected_expense ?? dado.despesaProjetada ?? 0,
        diasRestantes:    dado.days_remaining    ?? dado.diasRestantes    ?? 0,
      };
    } catch { this.previsaoMes = null; }
  }

  // ── Período ──────────────────────────────────────────────────────────────

  definirPeriodo(periodo: 'mes' | 'ultimos30' | 'ano'): void {
    this.periodoSelecionado = periodo;
    const agora = new Date();
    if (periodo === 'mes') {
      this.mesSelecionado = agora.getMonth() + 1;
      this.anoSelecionado  = agora.getFullYear();
    } else if (periodo === 'ultimos30') {
      const d = new Date(agora);
      d.setDate(d.getDate() - 30);
      this.mesSelecionado = d.getMonth() + 1;
      this.anoSelecionado  = d.getFullYear();
    } else {
      this.mesSelecionado = 1;
      this.anoSelecionado  = agora.getFullYear();
    }
    this._carregarTudo();
  }

  recarregar(): void { this._carregarTudo(); }

  ehMesPassado(mes: number): boolean {
    return mes <= this.hoje.getMonth() + 1 || this.anoSelecionado < this.hoje.getFullYear();
  }

  // ── Gráfico de barras ─────────────────────────────────────────────────────

  get maxGrafico(): number {
    if (!this.dadosGrafico.length) return 1;
    return Math.max(...this.dadosGrafico.map(m => Math.max(Number(m.receitas), Number(m.despesas))), 1);
  }

  alturaBarra(valor: number): string {
    const MAX_PX = 88;
    return Math.max((valor / this.maxGrafico) * MAX_PX, valor > 0 ? 3 : 0).toFixed(0) + 'px';
  }

  get contasTop3(): Conta[] {
    return [...this.contas]
      .sort((a, b) => b.saldoAtual - a.saldoAtual)
      .slice(0, 3);
  }

  corConta(conta: Conta): string { return conta.cor || '#3b82f6'; }

  labelTipoConta(tipo: number): string {
    return ({ 0: 'Banco', 1: 'Cartão de crédito', 2: 'Poupança' } as Record<number, string>)[tipo] ?? 'Outro';
  }

  // ── Totais calculados ─────────────────────────────────────────────────────

  get totalDespesasCategorias(): number {
    return this.despesasCategorias.reduce((s, c) => s + (Number(c.total) || 0), 0);
  }

  get totalReceitasCategorias(): number {
    return this.receitasCategorias.reduce((s, c) => s + (Number(c.total) || 0), 0);
  }

  // ── Formatação ────────────────────────────────────────────────────────────

  formatarMoeda(v: number | string | undefined | null): string {
    const n = Number(v);
    if (v == null || isNaN(n)) return 'R$ —';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  }

  formatarMoedaCurta(v: number): string {
    if (v == null || isNaN(Number(v))) return 'R$ —';
    const abs  = Math.abs(v);
    const sinal = v < 0 ? '-' : '';
    if (abs >= 1_000_000) return `R$ ${sinal}${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000)     return `R$ ${sinal}${(abs / 1_000).toFixed(0)}k`;
    return this.formatarMoeda(v);
  }

  formatarVariacao(v: number | null | undefined): string {
    if (v == null) return '—';
    return `${v >= 0 ? '↑' : '↓'} ${Math.abs(v).toFixed(1)}%`;
  }

  ehVariacaoPositiva(v: number | null | undefined): boolean { return (v ?? 0) >= 0; }

  formatarDataTransacao(iso: string): string {
    const datePart = (iso ?? '').split('T')[0];
    return new Date(datePart + 'T00:00:00').toLocaleDateString('pt-BR',
      { day: '2-digit', month: 'short' }).replace('.', '');
  }

  formatarPorcentagem(v: number): string { return v.toFixed(1) + '%'; }
}
