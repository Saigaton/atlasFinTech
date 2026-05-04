import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContaReceberService } from '../../core/services/conta-receber.service';
import { ContaReceber, RequisicaoRecebimento, ResumoContasAReceber } from '../../core/models/conta-receber.model';
import { Conta } from '../../core/models/conta.model';
import { Categoria, TipoCategoria } from '../../core/models/categoria.models';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { ShellComponent } from '../../shared/components/shell/shell.component';
import { EmpresaService } from '../../core/services/empresa.service';
import { ContaService } from '../../core/services/conta.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-contas-receber',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ShellComponent, LoadingSkeletonComponent],
  templateUrl: './contas-receber.component.html',
  styleUrls: ['./contas-receber.component.scss', './contas-receber.component.extra.scss']
})
export class ContasReceberComponent implements OnInit {

  // ── Estado ───────────────────────────────────────────────────────────────
  carregando     = true;
  enviando       = false;
  recebendo      = false;
  showModal      = false;
  showRecModal   = false;
  editandoId:    number | null      = null;
  recebendoItem: ContaReceber | null = null;

  items:      ContaReceber[]             = [];
  resumo:     ResumoContasAReceber | null = null;
  contas:     Conta[]                    = [];
  categorias: Categoria[]                = [];

  total     = 0;
  pagina    = 1;
  porPagina = 20;

  get paginas(): number {
    return Math.ceil(this.total / this.porPagina) || 1;
  }

  filtroSituacao = '';
  filtroPesquisa = '';

  formContaReceber!: FormGroup;
  formRecebimento!:  FormGroup;

  constructor(
    private empresaService:      EmpresaService,
    private contaReceberService: ContaReceberService,
    private contaService:        ContaService,
    private categoriaService:    CategoriaService,
    private toast:               ToastService,
    private formBuilder:         FormBuilder,
  ) {}

  ngOnInit(): void {
    this.criarFormularioContaReceber();
    this.criarFormularioRecebimento();

    const id = this.empresaService.ativoId();
    if (!id) return;

    this.contaService.listarContas(id).subscribe({
      next: r => { this.contas = r; },
    });
    this.categoriaService.listarCategoria(id, TipoCategoria.Receita).subscribe({
      next: r => { this.categorias = r.conteudo; },
    });

    this._carregar();
  }

  private criarFormularioContaReceber(): void {
    this.formContaReceber = this.formBuilder.group({
      descricao:      ['', [Validators.required, Validators.maxLength(200)]],
      valor:          [null as number | null, [Validators.required, Validators.min(0.01)]],
      dataVencimento: [new Date().toISOString().slice(0, 10), Validators.required],
      cliente:        [''],
      contaId:        [null as number | null],
      categoriaId:    [null as number | null],
      notas:          [''],
    });
  }

  private criarFormularioRecebimento(): void {
    this.formRecebimento = this.formBuilder.group({
      contaId:         [null as number | null, Validators.required],
      dataRecebimento: [new Date().toISOString().slice(0, 10), Validators.required],
      valor:           [null as number | null],
    });
  }

  // ── Carregamento ──────────────────────────────────────────────────────────

  private _carregar(): void {
    const id = this.empresaService.ativoId();
    if (!id) return;
    this.carregando = true;

    this.contaReceberService.listarContasReceber(id, {
      search:   this.filtroPesquisa || undefined,
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

    this.contaReceberService.obterResumoContaReceber(id).subscribe({
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
    this.formContaReceber.reset({ dataVencimento: new Date().toISOString().slice(0, 10) });
    this.showModal = true;
  }

  abrirEditar(item: ContaReceber): void {
    this.editandoId = Number(item.id);
    this.formContaReceber.patchValue({
      descricao:      item.descricao,
      valor:          item.valor,
      dataVencimento: String(item.dataVencimento).slice(0, 10),
      cliente:        item.cliente ?? '',
      contaId:        item.contaId ?? null,
      categoriaId:    item.categoriaId ?? null,
      notas:          item.notas ?? '',
    });
    this.showModal = true;
  }

  fecharModal(): void { this.showModal = false; }

  aoEnviar(): void {
    if (this.formContaReceber.invalid) { this.formContaReceber.markAllAsTouched(); return; }
    const id = this.empresaService.ativoId();
    if (!id) return;
    this.enviando = true;
    const v = this.formContaReceber.value;

    const payload: Partial<ContaReceber> = {
      descricao:      v.descricao!,
      valor:          v.valor!,
      dataVencimento: v.dataVencimento!,
      cliente:        v.cliente || undefined,
      contaId:        v.contaId ?? undefined,
      categoriaId:    v.categoriaId ?? undefined,
      notas:          v.notas || undefined,
    };

    if (this.editandoId) {
      this.contaReceberService.atualizarContaReceber(id, this.editandoId, payload).subscribe({
        next: ()          => { this.toast.success('Conta atualizada!'); this._concluir(); },
        error: (err: any) => { this.toast.error(err.error?.message ?? 'Erro.'); this.enviando = false; },
      });
    } else {
      this.contaReceberService.criarContaReceber(id, payload).subscribe({
        next: ()          => { this.toast.success('Conta a receber criada!'); this._concluir(); },
        error: (err: any) => { this.toast.error(err.error?.message ?? 'Erro.'); this.enviando = false; },
      });
    }
  }

  private _concluir(): void {
    this.enviando  = false;
    this.showModal = false;
    this._carregar();
  }

  // ── Modal recebimento ─────────────────────────────────────────────────────

  abrirRecebimento(item: ContaReceber): void {
    this.recebendoItem = item;
    this.formRecebimento.reset({
      dataRecebimento: new Date().toISOString().slice(0, 10),
      valor:           item.valor,
    });
    this.showRecModal = true;
  }

  fecharModalRecebimento(): void { this.showRecModal = false; }

  aoReceberItem(): void {
    if (this.formRecebimento.invalid) { this.formRecebimento.markAllAsTouched(); return; }
    const id = this.empresaService.ativoId();
    if (!id || !this.recebendoItem) return;
    this.recebendo = true;
    const v = this.formRecebimento.value;

    const req: RequisicaoRecebimento = {
      contaId:         v.contaId!,
      dataRecebimento: v.dataRecebimento!,
      valor:           v.valor ?? undefined,
    };

    this.contaReceberService.receberContaReceber(id, Number(this.recebendoItem.id), req).subscribe({
      next: () => {
        this.toast.success('Recebimento confirmado! Transação gerada automaticamente.');
        this.recebendo    = false;
        this.showRecModal = false;
        this._carregar();
      },
      error: (err: any) => { this.toast.error(err.error?.message ?? 'Erro.'); this.recebendo = false; },
    });
  }

  aoCancelar(item: ContaReceber): void {
    if (!confirm(`Cancelar "${item.descricao}"?`)) return;
    const id = this.empresaService.ativoId();
    if (!id) return;

    this.contaReceberService.deletarContaReceber(id, Number(item.id)).subscribe({
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
    return ({ 0: 'Pendente', 2: 'Inadimplente', 3: 'Recebido', 4: 'Cancelado' } as Record<number, string>)[s] ?? 'Desconhecido';
  }

  situacaoClass(s: number): string {
    return ({ 0: 'tag-pending', 2: 'tag-overdue', 3: 'tag-received', 4: 'tag-cancelled' } as Record<number, string>)[s] ?? '';
  }

  get arrayPaginas(): number[] {
    const range: number[] = [];
    for (let i = Math.max(1, this.pagina - 2); i <= Math.min(this.paginas, this.pagina + 2); i++) {
      range.push(i);
    }
    return range;
  }
}
