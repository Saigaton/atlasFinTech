import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import { handleApiError } from '../../core/handlers/handle-api-error';
import { ShellComponent } from '../../shared/components/shell/shell.component';
import { TransacaoModalComponent, SalvarTransacaoEvento } from './transacao-modal/transacao-modal.component';
import { AtualizarTransacaoDto, CriarTransacaoDto, FiltroTransacao, SituacaoTransacao, TipoTransacao, Transacao } from '../../core/models/transacao.model';
import { Conta } from '../../core/models/conta.model';
import { Categoria } from '../../core/models/categoria.models';
import { EmpresaService } from '../../core/services/empresa.service';
import { TransacaoService } from '../../core/services/transacao.service';
import { ContaService } from '../../core/services/conta.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { UnsubscriberBase } from '../../core/unsubscriber';

@Component({
  selector: 'app-transacao',
  standalone: true,
  imports: [CommonModule, ShellComponent, TransacaoModalComponent],
  templateUrl: './transacoes.component.html',
  styleUrls: ['./transacoes.component.scss', './transacoes.component.extra.scss'],
})
export class TransacoesComponent extends UnsubscriberBase implements OnInit {

  readonly TipoTransacao     = TipoTransacao;
  readonly SituacaoTransacao = SituacaoTransacao;

  // ── Estado ───────────────────────────────────────────────────────────────
  carregando = true;
  enviando   = false;
  showModal         = false;
  showConfirmCancel = false;
  editandoTransacao:   Transacao | null = null;
  transacaoParaCancelar: Transacao | null = null;

  transacoes: Transacao[] = [];
  contas:     Conta[]     = [];
  categorias: Categoria[] = [];

  total     = 0;
  pagina    = 1;
  porPagina = 20;

  filtroTipo     = '';
  filtroSituacao = '';
  filtroPesquisa = '';

  get paginas(): number { return Math.ceil(this.total / this.porPagina) || 1; }

  get arrayPaginas(): number[] {
    const range: number[] = [];
    for (let i = Math.max(1, this.pagina - 2); i <= Math.min(this.paginas, this.pagina + 2); i++) {
      range.push(i);
    }
    return range;
  }

  constructor(
    private empresaService:   EmpresaService,
    private transacaoService: TransacaoService,
    private contaService:     ContaService,
    private categoriaService: CategoriaService,
    private toast:            ToastService,
  ) { super(); }

  ngOnInit(): void {
    const id = this.empresaService.ativoId();
    if (!id) return;
    this._carregarContas(id);
    this._carregarCategorias(id);
    this._carregarTransacoes();
  }

  // ── Carregamento ──────────────────────────────────────────────────────────

  private _carregarTransacoes(): void {
    const id = this.empresaService.ativoId();
    if (!id) return;
    this.carregando = true;

    const filtros: FiltroTransacao = { pagina: this.pagina, porPagina: this.porPagina };
    if (this.filtroTipo)     filtros.tipo     = this.filtroTipo as any;
    if (this.filtroSituacao) filtros.situacao  = this.filtroSituacao as any;
    if (this.filtroPesquisa) filtros.pesquisa  = this.filtroPesquisa;

    this.transacaoService.listarTransacoes(id, filtros).subscribe({
      next: res => { this.transacoes = res.conteudo ?? []; this.total = res.total ?? 0; this.carregando = false; },
      error: ()  => { this.carregando = false; },
    });
  }

  private _carregarContas(id: number): void {
    this._subscriptions.push(
      this.contaService.listarContas(id).subscribe({
        next: res => { this.contas = res ?? []; },
      })
    );
  }

  private _carregarCategorias(id: number): void {
    this._subscriptions.push(
      this.categoriaService.listarCategoria(id).subscribe({
        next: res => { this.categorias = res ?? []; },
      })
    );
  }

  // ── Filtros ───────────────────────────────────────────────────────────────

  aplicarFiltro(campo: string, valor: string): void {
    this.pagina = 1;
    if (campo === 'tipo')     this.filtroTipo     = valor;
    if (campo === 'situacao') this.filtroSituacao = valor;
    if (campo === 'pesquisa') this.filtroPesquisa = valor;
    this._carregarTransacoes();
  }

  irParaPagina(p: number): void {
    if (p < 1 || p > this.paginas) return;
    this.pagina = p;
    this._carregarTransacoes();
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  abrirCriarTransacao(): void {
    this.editandoTransacao = null;
    this.showModal = true;
  }

  abrirEditarTransacao(transacao: Transacao): void {
    this.editandoTransacao = transacao;
    this.showModal = true;
  }

  onFechar(): void { this.showModal = false; }

  // ── Salvar (delegado pelo modal) ──────────────────────────────────────────

  onSalvar(evento: SalvarTransacaoEvento): void {
    const empresaId = this.empresaService.ativoId();
    if (!empresaId) return;

    this.enviando = true;
    const v = evento.value;

    if (evento.editando) {
      const payload: AtualizarTransacaoDto = {
        descricao:    v.descricao,
        valor:        Number(v.valor),
        data:         v.data,
        conta_id:     Number(v.contaId),
        categoria_id: Number(v.categoriaId),
        tipo:         Number(v.tipo) as TipoTransacao,
        situacao:     Number(v.situacao) as SituacaoTransacao,
        notas:        v.notas || null,
      };
      this._subscriptions.push(
        this.transacaoService.atualizarTransacao(empresaId, evento.editando.id, payload).pipe(
          handleApiError(this.toast, 'Erro ao atualizar transação.')
        ).subscribe({
          next: () => {
            this.toast.success('Transação atualizada!');
            this.enviando = false;
            this.onFechar();
            this._carregarTransacoes();
          },
          error: () => { this.enviando = false; },
        })
      );
    } else {
      const isTransf = Number(v.tipo) === TipoTransacao.Transferencia;
      const payload: CriarTransacaoDto = {
        descricao:    v.descricao,
        valor:        Number(v.valor),
        data:         v.data,
        conta_id:     Number(v.contaId),
        categoria_id: isTransf ? null : Number(v.categoriaId),
        tipo:         Number(v.tipo) as TipoTransacao,
        situacao:     Number(v.situacao) as SituacaoTransacao,
        notas:        v.notas || null,
        recorrencia:  v.recorrencia || 'nenhuma',
      };
      this._subscriptions.push(
        this.transacaoService.criarTransacao(empresaId, payload).pipe(
          handleApiError(this.toast, 'Erro ao registrar transação.')
        ).subscribe({
          next: () => {
            this.toast.success('Transação registrada!');
            this.enviando = false;
            this.onFechar();
            this._carregarTransacoes();
          },
          error: () => { this.enviando = false; },
        })
      );
    }
  }

  // ── Cancelar transação ────────────────────────────────────────────────────

  abrirConfirmCancel(transacao: Transacao): void {
    this.transacaoParaCancelar = transacao;
    this.showConfirmCancel     = true;
  }

  fecharConfirmCancel(): void {
    this.showConfirmCancel     = false;
    this.transacaoParaCancelar = null;
  }

  confirmarCancelamento(): void {
    const transacao = this.transacaoParaCancelar;
    const id        = this.empresaService.ativoId();
    if (!transacao || !id) return;

    this.enviando = true;
    this._subscriptions.push(
      this.transacaoService.deletarTransacao(id, transacao.id).pipe(
        handleApiError(this.toast, 'Erro ao cancelar transação.')
      ).subscribe({
        next: () => {
          this.toast.success('Transação cancelada.');
          this.enviando = false;
          this.fecharConfirmCancel();
          this._carregarTransacoes();
        },
        error: () => { this.enviando = false; },
      })
    );
  }

  onGerarRecorrencia(transacao: Transacao): void {
    if (!confirm(`Gerar ocorrências recorrentes para "${transacao.descricao}"? Serão criadas até 12 transações filhas.`)) return;
    const id = this.empresaService.ativoId();
    if (!id) return;
    this._subscriptions.push(
      this.transacaoService.gerarRecorrencia(id, transacao.id).pipe(
        handleApiError(this.toast, 'Erro ao gerar recorrências.')
      ).subscribe({
        next: res => {
          const n = Array.isArray(res) ? res.length : 0;
          this.toast.success(`${n} transação(ões) gerada(s) com sucesso!`);
          this._carregarTransacoes();
        },
        error: () => {},
      })
    );
  }

  // ── Formatação ────────────────────────────────────────────────────────────

  formatarCurrency(v: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  formatarData(iso: string): string {
    const datePart = iso ? iso.split('T')[0] : '';
    return new Date(datePart + 'T00:00:00').toLocaleDateString('pt-BR');
  }

  situacaoLabel(s: SituacaoTransacao): string {
    return ({
      [SituacaoTransacao.Confirmado]: 'Confirmado',
      [SituacaoTransacao.Pendente]:   'Pendente',
      [SituacaoTransacao.Cancelado]:  'Cancelado',
    } as Record<number, string>)[s] ?? String(s);
  }

  situacaoClass(s: SituacaoTransacao): string {
    return ({
      [SituacaoTransacao.Confirmado]: 'tag-confirmed',
      [SituacaoTransacao.Pendente]:   'tag-pending',
      [SituacaoTransacao.Cancelado]:  'tag-cancelled',
    } as Record<number, string>)[s] ?? '';
  }

  tipoLabel(t: TipoTransacao): string {
    return ({
      [TipoTransacao.Receita]:       'Receita',
      [TipoTransacao.Despesa]:       'Despesa',
      [TipoTransacao.Transferencia]: 'Transferência',
    } as Record<number, string>)[t] ?? String(t);
  }
}
