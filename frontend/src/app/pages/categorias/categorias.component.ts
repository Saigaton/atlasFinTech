import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmpresaService } from '../../core/services/empresa.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { ToastService } from '../../core/services/toast.service';
import { ShellComponent } from '../../shared/components/shell/shell.component';
import { Categoria, TipoCategoria } from '../../core/models/categoria.models';

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

  formulario!: FormGroup;

  constructor(
    private empresaService:   EmpresaService,
    private categoriaService: CategoriaService,
    private toast:            ToastService,
    private formBuilder:      FormBuilder,
  ) {}

  ngOnInit(): void {
    this.formulario = this.formBuilder.group({
      nome: ['', [Validators.required, Validators.minLength(1)]],
      tipo: [TipoCategoria.Despesa],
      cor:  ['#64748b'],
    });

    const id = this.empresaService.ativoId();
    if (!id) { this.carregando = false; return; }

    this.categoriaService.listarCategoria(id).subscribe({
      next:  res => { this.categorias = res.conteudo; this.carregando = false; },
      error: ()  => { this.carregando = false; },
    });
  }

  aoEnviar(): void {
    if (this.formulario.invalid) return;
    const id = this.empresaService.ativoId();
    if (!id) return;
    this.enviando = true;
    const v = this.formulario.value;

    this.categoriaService.criarCategoria(id, {
      nome: v.nome!,
      tipo: v.tipo as TipoCategoria,
      cor:  v.cor || null,
    }).subscribe({
      next: res => {
        this.toast.success('Categoria criada!');
        this.categorias = [...this.categorias, res.conteudo];
        this.enviando    = false;
        this.exibirModal = false;
        this.formulario.reset({ tipo: TipoCategoria.Despesa, cor: '#64748b' });
      },
      error: err => {
        this.toast.error(err.error?.mensagem ?? 'Erro ao criar.');
        this.enviando = false;
      },
    });
  }

  excluir(categoria: Categoria): void {
    if (!confirm(`Excluir categoria "${categoria.nome}"?`)) return;
    const id = this.empresaService.ativoId();
    if (!id) return;

    this.categoriaService.deletarCategoria(id, Number(categoria.id)).subscribe({
      next:  () => {
        this.toast.success('Categoria excluída.');
        this.categorias = this.categorias.filter(c => c.id !== categoria.id);
      },
      error: () => this.toast.error('Erro ao excluir.'),
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
