import {
  Component, EventEmitter, Input, OnChanges, Output, SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule,
  ValidationErrors, Validators,
} from '@angular/forms';
import {
  Transacao, TipoTransacao, SituacaoTransacao,
} from '../../../core/models/transacao.model';
import { Conta } from '../../../core/models/conta.model';
import { Categoria, TipoCategoria } from '../../../core/models/categoria.models';

export interface SalvarTransacaoEvento {
  value: any;
  editando: Transacao | null;
}

@Component({
  selector: 'app-transacao-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transacao-modal.component.html',
  styleUrl: './transacao-modal.component.scss',
})
export class TransacaoModalComponent implements OnChanges {
  @Input() transacao: Transacao | null = null;
  @Input() contas: Conta[] = [];
  @Input() categorias: Categoria[] = [];
  @Input() enviando = false;

  @Output() fechar = new EventEmitter<void>();
  @Output() salvar = new EventEmitter<SalvarTransacaoEvento>();

  readonly TipoTransacao     = TipoTransacao;
  readonly SituacaoTransacao = SituacaoTransacao;

  formTransacao!: FormGroup;

  constructor(private fb: FormBuilder) {
    this._criarFormulario();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['transacao']) return;
    const t = changes['transacao'].currentValue as Transacao | null;
    if (t) {
      this.formTransacao.patchValue({
        contaId:     t.conta?.id ?? null,
        categoriaId: t.categoria?.id ?? null,
        descricao:   t.descricao,
        valor:       t.valor,
        tipo:        t.tipo,
        situacao:    t.situacao,
        data:        t.data ? t.data.split('T')[0] : new Date().toISOString().slice(0, 10),
        notas:       t.notas ?? '',
      });
    } else {
      this.formTransacao.reset({
        tipo:        TipoTransacao.Despesa,
        situacao:    SituacaoTransacao.Pendente,
        data:        new Date().toISOString().slice(0, 10),
        recorrencia: 'nenhuma',
      });
    }
  }

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

  onSubmit(): void {
    if (this.formTransacao.invalid) { this.formTransacao.markAllAsTouched(); return; }
    this.salvar.emit({ value: this.formTransacao.value, editando: this.transacao });
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

  private _criarFormulario(): void {
    this.formTransacao = this.fb.group({
      contaId:                  [null as number | null, Validators.required],
      categoriaId:              [null as number | null, Validators.required],
      descricao:                ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      valor:                    [null as number | null, [Validators.required, Validators.min(0.01), Validators.max(99999999.99)]],
      tipo:                     [0, Validators.required],
      situacao:                 [0, Validators.required],
      data:                     [new Date().toISOString().slice(0, 10), Validators.required],
      notas:                    ['', Validators.maxLength(500)],
      recorrencia:              ['nenhuma'],
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
}
