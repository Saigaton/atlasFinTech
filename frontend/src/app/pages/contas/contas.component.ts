/**
 * Tela de Contas Bancárias — Atlas FinTech.
 *
 * Gerencia as contas bancárias da empresa ativa.
 *
 * Funcionalidades:
 *   - Cards com saldo atual calculado em tempo real pelo backend
 *   - Color picker para identificação visual da conta
 *   - Modal de criação com saldo inicial (initial_balance)
 *   - Edição e desativação (soft delete)
 *   - Modal de transferência entre contas da mesma empresa
 *
 * O saldo nunca é editado diretamente — é sempre a soma:
 *   initial_balance + Σ(transações confirmadas)
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { EmpresaService } from '../../core/services/empresa.service';
import { ContaService } from '../../core/services/conta.service';
import { ToastService } from '../../core/services/toast.service';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { ShellComponent } from '../../shared/components/shell/shell.component';
import { Conta } from '../../core/models/conta.model';
import { UnsubscriberComponent } from '../../core/unsubscriber.component';

@Component({
  selector: 'app-contas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ShellComponent,
           LoadingSkeletonComponent],
  templateUrl: './contas.component.html',
  styleUrl: './contas.component.scss',
})
export class ContasComponent extends UnsubscriberComponent implements OnInit {

  // ── Estado de carregamento ───────────────────────────────────────────────
  carregando      = true;
  enviando   = false;
  showModal    = false;
  showTransfer = false;
  transferindo = false;

  // ── Dados ────────────────────────────────────────────────────────────────
  contas: Conta[] = [];

  formConta!: FormGroup;
  formTransferencia!: FormGroup;

  tiposConta = [
    { value: 'checking',   label: 'Conta corrente' },
    { value: 'savings',    label: 'Poupança' },
    { value: 'investment', label: 'Investimento' },
    { value: 'cash',       label: 'Dinheiro' },
    { value: 'other',      label: 'Outros' },
  ];

  colorPresets = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899','#64748b'];

  constructor(
    private empresaService:    EmpresaService,
    private contaService: ContaService,
    private toast:      ToastService,
    private formBuilder:         FormBuilder,
  ) {
    super();
  }

  ngOnInit(): void { 
    this._load();
    this.criarFormularioConta();
    this.criarFormularioTransferencia(); 
  }

  private criarFormularioConta(){
    this.formConta = this.formBuilder.group({
      nome:            ['', [Validators.required, Validators.minLength(2)]],
      tipo:            ['checking'],
      nomeBanco:       [''],
      agencia:          [''],
      numeroConta:  [''],
      saldoInicial: [0, [Validators.min(0)]],
      cor:           ['#3b82f6'],
    });
  }

  private criarFormularioTransferencia(){
    this.formTransferencia = this.formBuilder.group({
      deContaId: [null as number | null, Validators.required],
      paraContaId:   [null as number | null, Validators.required],
      valor:          [null as number | null, [Validators.required, Validators.min(0.01)]],
      descricao:     ['Transferência entre contas', Validators.required],
      data:            [new Date().toISOString().split('T')[0], Validators.required],
    });
  }

  private _load(): void {
    const id = this.empresaService.ativoId();
    if (!id) { this.carregando = false; return; }

    this._subscriptions.push(
      this.contaService.listarContas(id).subscribe({
        next:  res => { this.contas = res; this.carregando = false; },
        error: ()  => { this.carregando = false; },
      })
    );
  }

  abrirCriarConta(): void {
    this.formConta.reset({ type: 'checking', initial_balance: 0, color: '#3b82f6' });
    this.showModal = true;
  }

  fecharModal(): void { this.showModal = false; }

  onSubmit(): void {
    if (this.formConta.invalid) { this.formConta.markAllAsTouched(); return; }
    const id = this.empresaService.ativoId();
    if (!id) return;

    this.enviando = true;

    this._subscriptions.push(
      this.contaService.criarConta(id, this.formConta.value as Conta).subscribe({
        next: () => {
          this.toast.success('Conta criada com sucesso!');
          this.enviando = false;
          this.fecharModal();
          this._load();
        },
        error: err => {
          this.toast.error(err.error?.message ?? 'Erro ao criar conta.');
          this.enviando = false;
        },
      })
    );
  }

  abrirTransferencia(): void {
    this.formTransferencia.reset({
      descricao: 'Transferência entre contas',
      data: new Date().toISOString().split('T')[0],
    });
    this.showTransfer = true;
  }

  fecharTransferencia(): void { this.showTransfer = false; }

  onTransferencia(): void {
    if (this.formTransferencia.invalid) { this.formTransferencia.markAllAsTouched(); return; }
    const id = this.empresaService.ativoId();
    if (!id) return;

    const v = this.formTransferencia.value;
    if (v.deContaId === v.paraContaId) {
      this.toast.error('A conta de origem e destino não podem ser a mesma.');
      return;
    }

    this.transferindo = true;

    // this._subscriptions.push(
    //   this.contaService.transfer(id, {
    //     from_account_id: v.from_account_id!,
    //     to_account_id:   v.to_account_id!,
    //     amount:          Number(v.amount),
    //     description:     v.description!,
    //     date:            v.date!,
    //   }).subscribe({
    //     next: () => {
    //       this.toast.success('Transferência realizada com sucesso!');
    //       this.transferindo = false;
    //       this.fecharTransferencia();
    //       this._load();
    //     },
    //     error: err => {
    //       this.toast.error(err.error?.message ?? 'Erro ao realizar transferência.');
    //       this.transferindo = false;
    //     },
    //   })
    // );
  }

  onDelete(conta: Conta): void {
    if (!confirm(`Desativar a conta "${conta.nome}"? Esta ação não pode ser desfeita.`)) return;
    const id = this.empresaService.ativoId();
    if (!id) return;

    this._subscriptions.push(
      this.contaService.deletarConta(id, conta.id).subscribe({
        next: () => { this.toast.success('Conta desativada.'); this._load(); },
        error: err => this.toast.error(err.error?.message ?? 'Erro ao desativar conta.'),
      })
    );
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  typeLabel(type: string): string {
    return this.tiposConta.find(t => t.value === type)?.label ?? type;
  }
}
