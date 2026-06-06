import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContaReceberService } from '../../core/services/conta-receber.service';
import { AtualizarContaReceberDto, ContaReceber, CriarContaReceberDto, RequisicaoRecebimento, ResumoContasAReceber } from '../../core/models/conta-receber.model';
import { Conta } from '../../core/models/conta.model';
import { Categoria, TipoCategoria } from '../../core/models/categoria.models';
import { ShellComponent } from '../../shared/components/shell/shell.component';
import { EmpresaService } from '../../core/services/empresa.service';
import { ContaService } from '../../core/services/conta.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { ToastService } from '../../core/services/toast.service';
import { handleApiError } from '../../core/handlers/handle-api-error';

@Component({
  selector: 'app-contas-receber',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ShellComponent],
  templateUrl: './contas-receber.component.html',
  styleUrls: ['./contas-receber.component.scss', './contas-receber.component.extra.scss']
})
export class ContasReceberComponent implements OnInit {

  // ── Estado ───────────────────────────────────────────────────────────────
  carregando     = true;
  enviando       = false;
  recebendo      = false;
  showModal         = false;
  showRecModal      = false;
  showConfirmCancel = false;
  editandoId:               number | null       = null;
  recebendoItem:            ContaReceber | null = null;
  contaReceberParaCancelar: ContaReceber | null = null;

  items:      ContaReceber[]              = [];
  resumo:     ResumoContasAReceber | null = null;
  contas:     Conta[]                     = [];
  categorias: Categoria[]                 = [];

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

    this.contaService.listarContas(id).pipe(
      handleApiError(this.toast, 'Erro ao carregar contas.')
    ).subscribe({
      next: r => { this.contas = r; },
    });
    this.categoriaService.listarCategoria(id, TipoCategoria.Receita).pipe(
      handleApiError(this.toast, 'Erro ao carregar categorias.')
    ).subscribe({
      next: r => { this.categorias = r ?? []; },
    });

    this._carregar();
  }

  private criarFormularioContaReceber(): void {
    this.formContaReceber = this.formBuilder.group({
      descricao:      ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      valor:          [null as number | null, [Validators.required, Validators.min(0.01), Validators.max(99999999.99)]],
      dataVencimento: [new Date().toISOString().slice(0, 10), Validators.required],
      contaId:        [null as number | null],
      categoriaId:    [null as number | null],
      cliente:        ['', Validators.maxLength(100)],
      notas:          ['', Validators.maxLength(500)],
    });
  }

  private criarFormularioRecebimento(): void {
    this.formRecebimento = this.formBuilder.group({
      contaId:         [null as number | null, Validators.required],
      dataRecebimento: [new Date().toISOString().slice(0, 10), Validators.required],
      valor:           [null as number | null, [Validators.min(0.01), Validators.max(99999999.99)]],
    });
  }

  // ── Carregamento ──────────────────────────────────────────────────────────

  private _carregar(): void {
    const id = this.empresaService.ativoId();
    if (!id) return;
    this.carregando = true;

    this.contaReceberService.listarContasReceber(id, {
      pesquisa: this.filtroPesquisa || undefined,
      status:   this.filtroSituacao || undefined,
      page:     this.pagina,
      per_page: this.porPagina,
    }).pipe(
      handleApiError(this.toast, 'Erro ao carregar contas a receber.')
    ).subscribe({
      next: r => {
        this.items      = r.conteudo ?? [];
        this.total      = r.total ?? 0;
        this.carregando = false;
      },
      error: () => { this.carregando = false; },
    });

    this.contaReceberService.obterResumoContaReceber(id).pipe(
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
    this.formContaReceber.reset({
      dataVencimento: new Date().toISOString().slice(0, 10),
      contaId:        null,
      categoriaId:    null,
      cliente:        '',
      notas:          '',
    });
    this.showModal = true;
  }

  abrirEditar(item: ContaReceber): void {
    this.editandoId = Number(item.id);
    this.formContaReceber.patchValue({
      descricao:      item.descricao,
      valor:          item.valor,
      dataVencimento: String(item.data_vencimento).split('T')[0],
      contaId:        item.conta?.id ?? null,
      categoriaId:    item.categoria?.id ?? null,
      cliente:        item.cliente ?? '',
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

    if (this.editandoId) {
      const payload: AtualizarContaReceberDto = {
        descricao:       v.descricao,
        valor:           Number(v.valor),
        data_vencimento: v.dataVencimento,
        conta_id:        v.contaId ? Number(v.contaId) : null,
        categoria_id:    v.categoriaId ? Number(v.categoriaId) : null,
        cliente:         v.cliente || null,
        notas:           v.notas || null,
      };
      this.contaReceberService.atualizarContaReceber(id, this.editandoId, payload).pipe(
        handleApiError(this.toast, 'Erro ao atualizar conta.')
      ).subscribe({
        next: () => { this.toast.success('Conta atualizada!'); this._concluir(); },
        error: () => { this.enviando = false; },
      });
    } else {
      const payload: CriarContaReceberDto = {
        descricao:       v.descricao,
        valor:           Number(v.valor),
        data_vencimento: v.dataVencimento,
        conta_id:        v.contaId ? Number(v.contaId) : null,
        categoria_id:    v.categoriaId ? Number(v.categoriaId) : null,
        cliente:         v.cliente || null,
        notas:           v.notas || null,
      };
      this.contaReceberService.criarContaReceber(id, payload).pipe(
        handleApiError(this.toast, 'Erro ao criar conta a receber.')
      ).subscribe({
        next: () => { this.toast.success('Conta a receber criada!'); this._concluir(); },
        error: () => { this.enviando = false; },
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

    this.contaReceberService.receberContaReceber(id, Number(this.recebendoItem.id), req).pipe(
      handleApiError(this.toast, 'Erro ao confirmar recebimento.')
    ).subscribe({
      next: () => {
        this.toast.success('Recebimento confirmado! Transação gerada automaticamente.');
        this.recebendo    = false;
        this.showRecModal = false;
        this._carregar();
      },
      error: () => { this.recebendo = false; },
    });
  }

  abrirConfirmCancel(item: ContaReceber): void {
    this.contaReceberParaCancelar = item;
    this.showConfirmCancel        = true;
  }

  fecharConfirmCancel(): void {
    this.showConfirmCancel        = false;
    this.contaReceberParaCancelar = null;
  }

  confirmarCancelamento(): void {
    const item = this.contaReceberParaCancelar;
    const id   = this.empresaService.ativoId();
    if (!item || !id) return;
    this.enviando = true;
    this.contaReceberService.deletarContaReceber(id, Number(item.id)).pipe(
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

  diasAte(vencimento: string): number {
    const d = new Date(vencimento.split('T')[0] + 'T00:00:00');
    return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  }

  labelSituacao(s: number): string {
    return ({ 0: 'Pendente', 1: 'Recebido', 2: 'Inadimplente' } as Record<number, string>)[s] ?? 'Desconhecido';
  }

  situacaoClass(s: number): string {
    return ({ 0: 'tag-pending', 1: 'tag-received', 2: 'tag-overdue' } as Record<number, string>)[s] ?? '';
  }

  get arrayPaginas(): number[] {
    const range: number[] = [];
    for (let i = Math.max(1, this.pagina - 2); i <= Math.min(this.paginas, this.pagina + 2); i++) {
      range.push(i);
    }
    return range;
  }
}
