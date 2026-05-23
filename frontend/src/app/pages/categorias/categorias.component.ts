import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmpresaService } from '../../core/services/empresa.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { ToastService } from '../../core/services/toast.service';
import { ShellComponent } from '../../shared/components/shell/shell.component';
import { AtualizarCategoria, Categoria, TipoCategoria } from '../../core/models/categoria.models';
import { handleApiError } from '../../core/handlers/handle-api-error';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ShellComponent],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.scss',
})
export class CategoriasComponent implements OnInit {

  readonly TipoCategoria = TipoCategoria;

  readonly cores = [
    '#16a34a', '#3b82f6', '#f59e0b', '#8b5cf6',
    '#ef4444', '#06b6d4', '#ec4899', '#64748b',
    '#f97316', '#dc2626',
  ];

  carregando   = true;
  enviando     = false;
  exibirModal  = false;
  categorias:  Categoria[] = [];

  modoEdicao       = false;
  categoriaEditandoId: number | null = null;

  formulario!: FormGroup;

  constructor(
    private empresaService:   EmpresaService,
    private categoriaService: CategoriaService,
    private toast:            ToastService,
    private formBuilder:      FormBuilder,
  ) {}

  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
      nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      tipo: [TipoCategoria.Despesa],
      cor:  ['#64748b'],
    });

    const id = this.empresaService.ativoId();
    if (!id) { this.carregando = false; return; }

    this.categoriaService.listarCategoria(id).pipe(
      handleApiError(this.toast, 'Erro ao carregar categorias.')
    ).subscribe({
      next:  res => { this.categorias = res ?? []; this.carregando = false; },
      error: ()   => { this.carregando = false; },
    });
  }

  abrirCriar(): void {
    this.modoEdicao = false;
    this.categoriaEditandoId = null;
    this.formulario.reset({ tipo: TipoCategoria.Despesa, cor: '#64748b' });
    this.exibirModal = true;
  }

  abrirEditar(cat: Categoria): void {
    this.modoEdicao = true;
    this.categoriaEditandoId = cat.id;
    this.formulario.reset({ nome: cat.nome, tipo: cat.tipo, cor: cat.cor ?? '#64748b' });
    this.exibirModal = true;
  }

  fecharModal(): void {
    this.exibirModal = false;
    this.modoEdicao = false;
    this.categoriaEditandoId = null;
  }

  aoEnviar(): void {
    if (this.formulario.invalid) return;
    const empresaId = this.empresaService.ativoId();
    if (!empresaId) return;
    this.enviando = true;
    const v = this.formulario.value;

    const operacao = this.modoEdicao && this.categoriaEditandoId != null
      ? this.categoriaService.atualizarCategoria(empresaId, this.categoriaEditandoId, {
          nome: v.nome!,
          tipo: v.tipo as TipoCategoria,
          cor:  v.cor || null,
        } as AtualizarCategoria)
      : this.categoriaService.criarCategoria(empresaId, {
          nome: v.nome!,
          tipo: v.tipo as TipoCategoria,
          cor:  v.cor || null,
        });

    operacao.pipe(
      handleApiError(this.toast, this.modoEdicao ? 'Erro ao atualizar.' : 'Erro ao criar.')
    ).subscribe({
      next: res => {
        if (this.modoEdicao) {
          this.categorias = this.categorias.map(c =>
            c.id === this.categoriaEditandoId ? res : c
          );
          this.toast.success('Categoria atualizada!');
        } else {
          this.categorias = [...this.categorias, res];
          this.toast.success('Categoria criada!');
        }
        this.enviando = false;
        this.fecharModal();
      },
      error: () => { this.enviando = false; },
    });
  }

  excluir(categoria: Categoria): void {
    if (!confirm(`Excluir categoria "${categoria.nome}"?`)) return;
    const id = this.empresaService.ativoId();
    if (!id) return;

    this.categoriaService.deletarCategoria(id, Number(categoria.id)).pipe(
      handleApiError(this.toast, 'Erro ao excluir.')
    ).subscribe({
      next: () => {
        this.toast.success('Categoria excluída.');
        this.categorias = this.categorias.filter(c => c.id !== categoria.id);
      },
    });
  }

  rotuloPorTipo(tipo: TipoCategoria): string {
    return ({
      [TipoCategoria.Receita]: 'Receita',
      [TipoCategoria.Despesa]: 'Despesa',
      [TipoCategoria.Ambos]:   'Ambos',
    } as Record<number, string>)[tipo] ?? String(tipo);
  }
}
