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
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { ShellComponent } from '../../shared/components/shell/shell.component';
import { AtualizarTransacaoDto, CriarTransacaoDto, FiltroTransacao, SituacaoTransacao, TipoTransacao, Transacao } from '../../core/models/transacao.model';
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
  imports: [CommonModule, ReactiveFormsModule, ShellComponent],
  templateUrl: './transacoes.component.html',
  styleUrls: ['./transacoes.component.scss', './transacoes.component.extra.scss'],
})
export class TransacoesComponent extends UnsubscriberComponent implements OnInit {

  readonly TipoTransacao    = TipoTransacao;
  readonly SituacaoTransacao = SituacaoTransacao;

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
    return Number(this.formTransacao.get('tipo')?.value) === TipoTransacao.Transferencia;
  }

  get categoriasFiltradas(): Categoria[] {
    const tipo = Number(this.formTransacao.get('tipo')?.value) as TipoTransacao;
    if (tipo === TipoTransacao.Transferencia) return [];
    return this.categorias.filter(c =>
      c.tipo === TipoCategoria.Ambos ||
      (tipo === TipoTransacao.Receita && c.tipo === TipoCategoria.Receita) ||
      (tipo === TipoTransacao.Despesa && c.tipo === TipoCategoria.Despesa)
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
    this.criarFormularioTransacao();
    const id = this.empresaService.ativoId();
    if (!id) return;
    this._carregarContas(id);
    this._carregarCategorias(id);
    this._carregarTransacoes();
  }

  private _contasIguaisValidator = (group: AbstractControl): ValidationErrors | null => {
    const tipo    = Number(group.get('tipo')?.value);
    const contaId = group.get('contaId')?.value;
    const destId  = group.get('transferenciaParaContaId')?.value;
    if (tipo === TipoTransacao.Transferencia && contaId && destId && Number(contaId) === Number(destId)) {
      return { contasIguais: true };
    }
    return null;
  };

  criarFormularioTransacao(){
    this.formTransacao = this.formBuilder.group({
      contaId:             [null as number | null, Validators.required],
      categoriaId:            [null as number | null, Validators.required],
      descricao:            ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      valor:                 [null as number | null, [Validators.required, Validators.min(0.01), Validators.max(99999999.99)]],
      tipo:                   [0, Validators.required],
      situacao:                 [0, Validators.required],
      data:                   [new Date().toISOString().slice(0, 10), Validators.required],
      notas:                  ['', Validators.maxLength(500)],
      recorrencia:             ['nenhuma'],
      transferenciaParaContaId: [null as number | null],
    }, { validators: this._contasIguaisValidator });

    this.formTransacao.get('tipo')?.valueChanges.subscribe(tipo => {
      const categoriaCtrl = this.formTransacao.get('categoriaId');
      const destinoCtrl   = this.formTransacao.get('transferenciaParaContaId');
      if (Number(tipo) === TipoTransacao.Transferencia) {
        categoriaCtrl?.clearValidators();
        categoriaCtrl?.setValue(null);
        destinoCtrl?.setValidators(Validators.required);
      } else {
        categoriaCtrl?.setValidators(Validators.required);
        destinoCtrl?.clearValidators();
        destinoCtrl?.setValue(null);
      }
      categoriaCtrl?.updateValueAndValidity();
      destinoCtrl?.updateValueAndValidity();
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
        this.transacoes = res.conteudo ?? [];
        this.total        = res.total ?? 0;
        this.carregando      = false;
      },
      error: () => { this.carregando = false; },
    })
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
        next: res => { this.categorias = res.conteudo ?? []; },
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
      tipo:        TipoTransacao.Despesa,
      situacao:    SituacaoTransacao.Pendente,
      data:        new Date().toISOString().slice(0, 10),
      recorrencia: 'nenhuma',
    });
    this.showModal = true;
  }

  abrirEditarTransacao(transacao: Transacao): void {
    this.editandoTransacao = transacao;
    this.formTransacao.patchValue({
      contaId:     transacao.conta?.id ?? null,
      categoriaId: transacao.categoria?.id ?? null,
      descricao:   transacao.descricao,
      valor:       transacao.valor,
      tipo:        transacao.tipo,
      situacao:    transacao.situacao,
      data:        transacao.data ? transacao.data.split('T')[0] : new Date().toISOString().slice(0, 10),
      notas:       transacao.notas ?? '',
    });
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  // ── Salvar ────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.formTransacao.invalid) { this.formTransacao.markAllAsTouched(); return; }
    const empresaId = this.empresaService.ativoId();
    if (!empresaId) return;

    this.enviando = true;
    const v = this.formTransacao.value;

    if (this.editandoTransacao) {
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
        this.transacaoService.atualizarTransacao(empresaId, this.editandoTransacao.id, payload).subscribe({
          next: () => {
            this.toast.success('Transação atualizada!');
            this.enviando = false;
            this.closeModal();
            this._carregarTransacoes();
          },
          error: err => {
            this.toast.error(err.error?.erro ?? 'Erro ao atualizar.');
            this.enviando = false;
          },
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
        this.transacaoService.criarTransacao(empresaId, payload).subscribe({
          next: () => {
            this.toast.success('Transação registrada!');
            this.enviando = false;
            this.closeModal();
            this._carregarTransacoes();
          },
          error: err => {
            this.toast.error(err.error?.erro ?? 'Erro ao registrar.');
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