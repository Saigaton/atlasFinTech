import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContaPagarService } from '../../core/services/conta-pagar.service';
import { AtualizarContaPagarDto, ContaPagar, CriarContaPagarDto, RequisicaoPagamento, ResumoContasAPagar } from '../../core/models/conta-pagar.model';
import { ShellComponent } from '../../shared/components/shell/shell.component';
import { EmpresaService } from '../../core/services/empresa.service';
import { ToastService } from '../../core/services/toast.service';
import { ContaService } from '../../core/services/conta.service';
import { Conta } from '../../core/models/conta.model';
import { CategoriaService } from '../../core/services/categoria.service';
import { Categoria } from '../../core/models/categoria.models';
import { handleApiError } from '../../core/handlers/handle-api-error';

@Component({
  selector: 'app-contas-pagar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ShellComponent],
  templateUrl: './contas-pagar.component.html',
  styleUrls: ['./contas-pagar.component.scss', './contas-pagar.component.extra.scss']
})
export class ContasPagarComponent implements OnInit {

  // ── Estado ───────────────────────────────────────────────────────────────
  carregando   = true;
  enviando     = false;
  pagando      = false;
  showModal         = false;
  showPayModal      = false;
  showConfirmCancel = false;
  editandoId:             number | null  = null;
  pagandoItem:            ContaPagar | null = null;
  contaPagarParaCancelar: ContaPagar | null = null;

  items:      ContaPagar[]             = [];
  resumo:     ResumoContasAPagar | null = null;
  contas:     Conta[]                  = [];
  categorias: Categoria[]              = [];

  total     = 0;
  pagina    = 1;
  porPagina = 20;

  get paginas(): number {
    return Math.ceil(this.total / this.porPagina) || 1;
  }

  filtroSituacao = '';
  filtroPesquisa = '';

  formContaPagar!: FormGroup;
  formPagamento!: FormGroup;

  constructor(
    private empresaService:    EmpresaService,
    private contaPagarService: ContaPagarService,
    private contaService:      ContaService,
    private categoriaService:  CategoriaService,
    private toast:             ToastService,
    private formBuilder:       FormBuilder,
  ) {}

  ngOnInit(): void {
    this.criarFormularioContaPagar();
    this.criarFormularioPagamento();

    const id = this.empresaService.ativoId();
    if (!id) return;
    this._carregar();
    this._carregarSelects(id);
  }

  private _carregarSelects(empresaId: number): void {
    this.contaService.listarContas(empresaId).pipe(
      handleApiError(this.toast, 'Erro ao carregar contas.')
    ).subscribe({
      next: r => { this.contas = r; },
    });
    this.categoriaService.listarCategoria(empresaId).pipe(
      handleApiError(this.toast, 'Erro ao carregar categorias.')
    ).subscribe({
      next: r => { this.categorias = r ?? []; },
    });
  }

  private criarFormularioContaPagar(): void {
    this.formContaPagar = this.formBuilder.group({
      descricao:      ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      valor:          [null as number | null, [Validators.required, Validators.min(0.01), Validators.max(99999999.99)]],
      dataVencimento: [new Date().toISOString().slice(0, 10), Validators.required],
      contaId:        [null as number | null],
      categoriaId:    [null as number | null],
      notas:          ['', Validators.maxLength(500)],
      totalParcelas:  [1, [Validators.required, Validators.min(1), Validators.max(360)]],
    });
  }

  private criarFormularioPagamento(): void {
    this.formPagamento = this.formBuilder.group({
      contaId:       [null as number | null, Validators.required],
      dataPagamento: [new Date().toISOString().slice(0, 10), Validators.required],
      valorPago:     [null as number | null, [Validators.min(0.01), Validators.max(99999999.99)]],
    });
  }

  // ── Carregamento ──────────────────────────────────────────────────────────

  private _carregar(): void {
    const id = this.empresaService.ativoId();
    if (!id) return;
    this.carregando = true;

    this.contaPagarService.listarContasPagar(id, {
      status:   this.filtroSituacao || undefined,
      pesquisa: this.filtroPesquisa || undefined,
      page:     this.pagina,
      per_page: this.porPagina,
    }).pipe(
      handleApiError(this.toast, 'Erro ao carregar contas a pagar.')
    ).subscribe({
      next: r => {
        this.items      = r.conteudo ?? [];
        this.total      = r.total ?? 0;
        this.carregando = false;
      },
      error: () => { this.carregando = false; },
    });

    this.contaPagarService.obterResumoContaPagar(id).pipe(
      handleApiError(this.toast, 'Erro ao carregar resumo.')
    ).subscribe({
      next: r => { this.resumo = r ?? null; },
    });
  }

  definirFiltro(s: string): void {
    this.filtroSituacao = s;
    this.pagina = 1;
    this._carregar();
  }

  pesquisar(termo: string): void {
    this.filtroPesquisa = termo;
    this.pagina = 1;
    this._carregar();
  }

  irParaPagina(p: number): void {
    if (p < 1 || p > this.paginas) return;
    this.pagina = p;
    this._carregar();
  }

  // ── Modal criar/editar ────────────────────────────────────────────────────

  abrirCriar(): void {
    this.editandoId = null;
    this.formContaPagar.reset({
      dataVencimento: new Date().toISOString().slice(0, 10),
      totalParcelas: 1,
      notas: '',
      contaId: null,
      categoriaId: null,
    });
    this.showModal = true;
  }

  abrirEditar(item: ContaPagar): void {
    this.editandoId = Number(item.id);
    this.formContaPagar.patchValue({
      descricao:      item.descricao,
      valor:          item.valor,
      dataVencimento: String(item.data_vencimento).split('T')[0],
      contaId:        item.conta?.id ?? null,
      categoriaId:    item.categoria?.id ?? null,
      notas:          item.notas ?? '',
    });
    this.showModal = true;
  }

  fecharModal(): void { this.showModal = false; }

  aoEnviar(): void {
    if (this.formContaPagar.invalid) { this.formContaPagar.markAllAsTouched(); return; }
    const id = this.empresaService.ativoId();
    if (!id) return;
    this.enviando = true;
    const v = this.formContaPagar.value;

    if (this.editandoId) {
      const payload: AtualizarContaPagarDto = {
        descricao:       v.descricao,
        valor:           Number(v.valor),
        data_vencimento: v.dataVencimento,
        conta_id:        v.contaId ? Number(v.contaId) : null,
        categoria_id:    v.categoriaId ? Number(v.categoriaId) : null,
        notas:           v.notas || null,
      };
      this.contaPagarService.atualizarContaPagar(id, this.editandoId, payload).pipe(
        handleApiError(this.toast, 'Erro ao atualizar conta.')
      ).subscribe({
        next: () => { this.toast.success('Conta atualizada!'); this._concluir(); },
        error: () => { this.enviando = false; },
      });
    } else {
      const payload: CriarContaPagarDto = {
        descricao:       v.descricao,
        valor:           Number(v.valor),
        data_vencimento: v.dataVencimento,
        conta_id:        v.contaId ? Number(v.contaId) : null,
        categoria_id:    v.categoriaId ? Number(v.categoriaId) : null,
        notas:           v.notas || null,
        total_parcelas:  Number(v.totalParcelas) || 1,
      };
      this.contaPagarService.criarContaPagar(id, payload).pipe(
        handleApiError(this.toast, 'Erro ao criar conta a pagar.')
      ).subscribe({
        next: r => {
          const n = r?.length ?? 1;
          this.toast.success(n > 1 ? `${n} parcelas criadas!` : 'Conta a pagar criada!');
          this._concluir();
        },
        error: () => { this.enviando = false; },
      });
    }
  }

  private _concluir(): void {
    this.enviando  = false;
    this.showModal = false;
    this._carregar();
  }

  // ── Modal pagamento ───────────────────────────────────────────────────────

  abrirPagamento(item: ContaPagar): void {
    this.pagandoItem = item;
    this.formPagamento.reset({
      dataPagamento: new Date().toISOString().slice(0, 10),
      valorPago:     item.valor,
    });
    this.showPayModal = true;
  }

  fecharModalPagamento(): void { this.showPayModal = false; }

  aoPagar(): void {
    if (this.formPagamento.invalid) { this.formPagamento.markAllAsTouched(); return; }
    const id = this.empresaService.ativoId();
    if (!id || !this.pagandoItem) return;
    this.pagando = true;
    const v = this.formPagamento.value;

    const req: RequisicaoPagamento = {
      contaId:       v.contaId!,
      dataPagamento: v.dataPagamento!,
      valorPago:     v.valorPago ?? undefined,
    };

    this.contaPagarService.pagarContaPagar(id, Number(this.pagandoItem.id), req).pipe(
      handleApiError(this.toast, 'Erro ao registrar pagamento.')
    ).subscribe({
      next: () => {
        this.toast.success('Pagamento registrado! Transação gerada automaticamente.');
        this.pagando      = false;
        this.showPayModal = false;
        this._carregar();
      },
      error: () => { this.pagando = false; },
    });
  }

  abrirConfirmCancel(item: ContaPagar): void {
    this.contaPagarParaCancelar = item;
    this.showConfirmCancel      = true;
  }

  fecharConfirmCancel(): void {
    this.showConfirmCancel      = false;
    this.contaPagarParaCancelar = null;
  }

  confirmarCancelamento(): void {
    const item = this.contaPagarParaCancelar;
    const id   = this.empresaService.ativoId();
    if (!item || !id) return;
    this.enviando = true;
    this.contaPagarService.deletarContaPagar(id, Number(item.id)).pipe(
      handleApiError(this.toast, 'Erro ao cancelar.')
    ).subscribe({
      next: () => {
        this.toast.success('Conta cancelada.');
        this.enviando = false;
        this.fecharConfirmCancel();
        this._carregar();
      },
      error: () => { this.enviando = false; },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatarMoeda(v: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  formatarData(d: Date | string): string {
    const s = String(d).slice(0, 10);
    return new Date(s + 'T00:00:00').toLocaleDateString('pt-BR');
  }

  labelSituacao(s: number): string {
    return ({ 0: 'Pendente', 1: 'Pago', 2: 'Vencida' } as Record<number, string>)[s] ?? 'Desconhecido';
  }

  situacaoClass(s: number): string {
    return ({ 0: 'tag-pending', 1: 'tag-paid', 2: 'tag-overdue' } as Record<number, string>)[s] ?? '';
  }

  diasAte(vencimento: string): number {
    const d = new Date(vencimento.split('T')[0] + 'T00:00:00');
    return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  }

  get arrayPaginas(): number[] {
    const range: number[] = [];
    for (let i = Math.max(1, this.pagina - 2); i <= Math.min(this.paginas, this.pagina + 2); i++) {
      range.push(i);
    }
    return range;
  }
}
