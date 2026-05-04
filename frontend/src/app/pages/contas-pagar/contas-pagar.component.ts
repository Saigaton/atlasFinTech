import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContaPagarService } from '../../core/services/conta-pagar.service';
import { ContaPagar, RequisicaoPagamento, ResumoContasAPagar } from '../../core/models/conta-pagar.model';
import { Conta } from '../../core/models/conta.model';
import { Categoria, TipoCategoria } from '../../core/models/categoria.models';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { ShellComponent } from '../../shared/components/shell/shell.component';
import { EmpresaService } from '../../core/services/empresa.service';
import { ContaService } from '../../core/services/conta.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-contas-pagar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ShellComponent, LoadingSkeletonComponent],
  templateUrl: './contas-pagar.component.html',
  styleUrl: './contas-pagar.component.scss'
})
export class ContasPagarComponent implements OnInit {

  // ── Estado ───────────────────────────────────────────────────────────────
  carregando   = true;
  enviando     = false;
  pagando      = false;
  showModal    = false;
  showPayModal = false;
  editandoId:  number | null  = null;
  pagandoItem: ContaPagar | null = null;

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

    this.contaService.listarContas(id).subscribe({
      next: r => { this.contas = r; },
    });
    this.categoriaService.listarCategoria(id, TipoCategoria.Despesa).subscribe({
      next: r => { this.categorias = r.conteudo; },
    });

    this._carregar();
  }

  private criarFormularioContaPagar(): void {
    this.formContaPagar = this.formBuilder.group({
      descricao:      ['', [Validators.required, Validators.maxLength(200)]],
      valor:          [null as number | null, [Validators.required, Validators.min(0.01)]],
      dataVencimento: [new Date().toISOString().slice(0, 10), Validators.required],
      contaId:        [null as number | null],
      categoriaId:    [null as number | null],
      notas:          [''],
      totalParcelas:  [1, [Validators.min(1), Validators.max(360)]],
    });
  }

  private criarFormularioPagamento(): void {
    this.formPagamento = this.formBuilder.group({
      contaId:       [null as number | null, Validators.required],
      dataPagamento: [new Date().toISOString().slice(0, 10), Validators.required],
      valorPago:     [null as number | null],
    });
  }

  // ── Carregamento ──────────────────────────────────────────────────────────

  private _carregar(): void {
    const id = this.empresaService.ativoId();
    if (!id) return;
    this.carregando = true;

    this.contaPagarService.listarContasPagar(id, {
      status:   this.filtroSituacao || undefined,
      page:     this.pagina,
      per_page: this.porPagina,
    }).subscribe({
      next: r => {
        this.items      = r.conteudo;
        this.total      = r.total;
        this.carregando = false;
      },
      error: () => { this.carregando = false; },
    });

    this.contaPagarService.obterResumoContaPagar(id).subscribe({
      next: r => { this.resumo = r.conteudo; },
    });
  }

  definirFiltro(s: string): void {
    this.filtroSituacao = s;
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
    this.formContaPagar.reset({ dataVencimento: new Date().toISOString().slice(0, 10), totalParcelas: 1 });
    this.showModal = true;
  }

  abrirEditar(item: ContaPagar): void {
    this.editandoId = Number(item.id);
    this.formContaPagar.patchValue({
      descricao:      item.descricao,
      valor:          item.valor,
      dataVencimento: String(item.dataVencimento).slice(0, 10),
      contaId:        null,
      categoriaId:    null,
      notas:          '',
      totalParcelas:  1,
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
      this.contaPagarService.atualizarContaPagar(id, this.editandoId, v as ContaPagar).subscribe({
        next: ()          => { this.toast.success('Conta atualizada!'); this._concluir(); },
        error: (err: any) => { this.toast.error(err.error?.message ?? 'Erro.'); this.enviando = false; },
      });
    } else {
      this.contaPagarService.criarContaPagar(id, v as ContaPagar).subscribe({
        next: r => {
          const n = r.conteudo?.length ?? 1;
          this.toast.success(n > 1 ? `${n} parcelas criadas!` : 'Conta a pagar criada!');
          this._concluir();
        },
        error: (err: any) => { this.toast.error(err.error?.message ?? 'Erro.'); this.enviando = false; },
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

    this.contaPagarService.pagarContaPagar(id, Number(this.pagandoItem.id), req).subscribe({
      next: () => {
        this.toast.success('Pagamento registrado! Transação gerada automaticamente.');
        this.pagando      = false;
        this.showPayModal = false;
        this._carregar();
      },
      error: (err: any) => { this.toast.error(err.error?.message ?? 'Erro.'); this.pagando = false; },
    });
  }

  aoCancelar(item: ContaPagar): void {
    if (!confirm(`Cancelar "${item.descricao}"?`)) return;
    const id = this.empresaService.ativoId();
    if (!id) return;

    this.contaPagarService.deletarContaPagar(id, Number(item.id)).subscribe({
      next: ()  => { this.toast.success('Conta cancelada.'); this._carregar(); },
      error: ()  => this.toast.error('Erro ao cancelar.'),
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

  diasAte(vencimento: Date | string): number {
    const s = String(vencimento).slice(0, 10);
    const d = new Date(s + 'T00:00:00');
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
