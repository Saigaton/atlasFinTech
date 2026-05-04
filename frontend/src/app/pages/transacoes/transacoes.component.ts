/**
 * Tela de Transações — Atlas FinTech.
 *
 * Lista paginada de transações com filtros e modal de criação/edição.
 *
 * Funcionalidades:
 *   - Filtro por tipo (receita/despesa/transferência) e status
 *   - Busca textual na descrição
 *   - Paginação com 20 itens por página
 *   - Modal de criação com suporte a transferências (campo de conta destino)
 *   - Edição inline via modal reutilizável
 *   - Exclusão com feedback imediato
 *   - Geração de recorrência para transações com recurrence != 'none'
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { ShellComponent } from '../../shared/components/shell/shell.component';
import { FiltroTransacao, SituacaoTransacao, Transacao } from '../../core/models/transacao.model';
import { Conta } from '../../core/models/conta.model';
import { Categoria, TipoCategoria } from '../../core/models/categoria.models';
import { EmpresaService } from '../../core/services/empresa.service';
import { TransacaoService } from '../../core/services/transacao.service';
import { ContaService } from '../../core/services/conta.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { UnsubscriberComponent } from '../../core/unsubscriber.component';

/**
 * Tela de transações — Atlas FinTech.
 * Lista com filtros, paginação, e modal de criação/edição.
 */
@Component({
  selector: 'app-transacao',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ShellComponent,
           LoadingSkeletonComponent],
  templateUrl: './transacoes.component.html',
  styleUrls: ['./transacoes.component.scss', './transacoes.component.extra.scss'],
})
export class TransacoesComponent extends UnsubscriberComponent implements OnInit {

  // ── Estado ───────────────────────────────────────────────────────────────
  carregando    = true;
  enviando = false;
  showModal  = false;
  editandoTransacao: Transacao | null = null;

  transacoes: Transacao[] = [];
  contas:     Conta[]     = [];
  categorias:   Categoria[]    = [];

  total   = 0;
  pagina    = 1;
  porPagina = 20;

  get paginas(): number {
    return Math.ceil(this.total / this.porPagina) || 1;
  }

  // Filtros
  filtroTipo   = '';
  filtroSituacao = '';
  filtroPesquisa = '';

  formTransacao!: FormGroup;

  get isTransferencia(): boolean {
    return this.formTransacao.get('tipo')?.value === 'transferencia';
  }

  get categoriasFiltradas(): Categoria[] {
    const tipo = this.formTransacao.get('tipo')?.value;
    return this.categorias.filter(c =>
      tipo === 'transfer' ? false : c.tipo === TipoCategoria.Ambos || c.tipo === tipo
    );
  }

  get arrayPaginas(): number[] {
    const range: number[] = [];
    for (let i = Math.max(1, this.pagina - 2); i <= Math.min(this.paginas, this.pagina + 2); i++) {
      range.push(i);
    }
    return range;
  }

  constructor(
    private empresaService:    EmpresaService,
    private transacaoService:  TransacaoService,
    private contaService: ContaService,
    private categoriaService: CategoriaService,
    private toast:      ToastService,
    private formBuilder:         FormBuilder,
  ) {
    super();
  }

  ngOnInit(): void {
    const id = this.empresaService.ativoId();
    if (!id) return;
    this._carregarContas(id);
    this._carregarCategorias(id);
    this._carregarTransacoes();
  }

  criarFormularioTransacao(){
    this.formTransacao = this.formBuilder.group({
      contaId:             [null as number | null, Validators.required],
      categoriaId:            [null as number | null],
      descricao:            ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
      valor:                 [null as number | null, [Validators.required, Validators.min(0.01)]],
      tipo:                   [0, Validators.required],
      situacao:                 [0, Validators.required],
      data:                   [new Date().toISOString().slice(0, 10), Validators.required],
      notas:                  [''],
      recorrencia:             ['none'],
      transferenciaParaContaId: [null as number | null],
    });
  }

  // ── Carregamento ──────────────────────────────────────────────────────────

  private _carregarTransacoes(): void {
    const id = this.empresaService.ativoId();
    if (!id) return;
    this.carregando = true;

    const filtros: FiltroTransacao = {
      pagina:     this.pagina,
      porPagina: this.porPagina,
    };
    if (this.filtroTipo)   filtros.tipo   = this.filtroTipo as any;
    if (this.filtroSituacao) filtros.situacao = this.filtroSituacao as any;
    if (this.filtroPesquisa) filtros.pesquisa = this.filtroPesquisa;

    this.transacaoService.listarTransacoes(id, filtros).subscribe({
      next: res => {
        this.transacoes = res.conteudo;
        this.total        = res.total;
        this.carregando      = false;
      },
      error: () => { this.carregando = false; },
    })
  }

  private _carregarContas(id: number): void {
    this._subscriptions.push(
      this.contaService.listarContas(id).subscribe({
        next: res => { this.contas = res; },
      })
    );
  }

  private _carregarCategorias(id: number): void {
    this._subscriptions.push(
      this.categoriaService.listarCategoria(id).subscribe({
        next: res => { this.categorias = res.conteudo; },
      })
    );
  }

  // ── Filtros ───────────────────────────────────────────────────────────────

  aplicarFiltro(campo: string, valor: string): void {
    this.pagina = 1;
    if (campo === 'tipo')   this.filtroTipo   = valor;
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
    this.formTransacao.reset({
      tipo: TipoCategoria.Despesa, situacao: SituacaoTransacao,
      data: new Date().toISOString().slice(0, 10),
      recorrencia: 'none',
    });
    this.showModal = true;
  }

  abrirEditarTransacao(transacao: Transacao): void {
    this.editandoTransacao = transacao;
    this.formTransacao.patchValue({
      conta:  transacao.conta,
      categoria: transacao.categoria,
      descricao: transacao.descricao,
      valor:      transacao.valor,
      tipo:        transacao.tipo,
      situacao:      transacao.situacao,
      data:        transacao.data,
      notas:       transacao.notas ?? '',
      recorrencia:  transacao.recorrencia,
    });
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  // ── Salvar ────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.formTransacao.invalid) { this.formTransacao.markAllAsTouched(); return; }
    const id = this.empresaService.ativoId();
    if (!id) return;

    this.enviando = true;

    if (this.editandoTransacao) {
      this.transacaoService.atualizarTransacao(id, this.editandoTransacao.id, this.formTransacao.value as Transacao).subscribe({
        next: () => {
          this.toast.success('Transação atualizada!');
          this.enviando = false;
          this.closeModal();
          this._carregarTransacoes();
        },
        error: err => {
          this.toast.error(err.error?.message ?? 'Erro ao atualizar.');
          this.enviando = false;
        },
      })
    } else {
      this._subscriptions.push(
        this.transacaoService.criarTransacao(id, this.formTransacao.value as Transacao).subscribe({
          next: () => {
            this.toast.success('Transação registrada!');
            this.enviando = false;
            this.closeModal();
            this._carregarTransacoes();
          },
          error: err => {
            this.toast.error(err.error?.message ?? 'Erro ao registrar.');
            this.enviando = false;
          },
        })
      );
    }
  }

  // ── Deletar ───────────────────────────────────────────────────────────────

  onDelete(transacao: Transacao): void {
    if (!confirm(`Cancelar a transação "${transacao.descricao}"?`)) return;
    const id = this.empresaService.ativoId();
    if (!id) return;

    this._subscriptions.push(
      this.transacaoService.deletarTransacao(id, transacao.id).subscribe({
        next: () => {
          this.toast.success('Transação cancelada.');
          this._carregarTransacoes();
        },
        error: () => this.toast.error('Erro ao cancelar transação.'),
      })
    );
  }

  onGerarRecorrencia(transacao: Transacao): void {
    if (!confirm(`Gerar ocorrências recorrentes para "${transacao.descricao}"? Serão criadas até 12 transações filhas.`)) return;
    const id = this.empresaService.ativoId();
    if (!id) return;

    this._subscriptions.push(
      this.transacaoService.gerarRecorrencia(id, transacao.id).subscribe({
        next: res => {
          const n = Array.isArray(res.conteudo) ? res.conteudo.length : 0;
          this.toast.success(`${n} transação(ões) gerada(s) com sucesso!`);
          this._carregarTransacoes();
        },
        error: err => this.toast.error(err.error?.message ?? 'Erro ao gerar recorrências.'),
      })
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatarCurrency(v: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  formatarData(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');
  }

  situacaoLabel(s: string): string {
    return ({ confirmed: 'Confirmado', pending: 'Pendente', cancelled: 'Cancelado' } as Record<string, string>)[s] ?? s;
  }

  situacaoClass(s: string): string {
    return ({ confirmed: 'tag-confirmed', pending: 'tag-pending', cancelled: 'tag-cancelled' } as Record<string, string>)[s] ?? '';
  }

  tipoLabel(t: string): string {
    return ({ income: 'Receita', expense: 'Despesa', transfer: 'Transferência' } as Record<string, string>)[t] ?? t;
  }
}