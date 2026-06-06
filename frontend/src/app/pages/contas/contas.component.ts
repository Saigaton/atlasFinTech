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
import { ShellComponent } from '../../shared/components/shell/shell.component';
import { Conta, TipoConta } from '../../core/models/conta.model';
import { UnsubscriberBase } from '../../core/unsubscriber';
import { handleApiError } from '../../core/handlers/handle-api-error';

@Component({
  selector: 'app-contas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ShellComponent],
  templateUrl: './contas.component.html',
  styleUrl: './contas.component.scss',
})
export class ContasComponent extends UnsubscriberBase implements OnInit {

  // ── Estado de carregamento ───────────────────────────────────────────────
  carregando      = true;
  enviando   = false;
  showModal         = false;
  showTransfer      = false;
  showConfirmDelete = false;
  transferindo      = false;

  contaParaDesativar: Conta | null = null;

  modoEdicao       = false;
  contaEditandoId: number | null = null;

  // ── Dados ────────────────────────────────────────────────────────────────
  contas: Conta[] = [];

  formConta!: FormGroup;
  formTransferencia!: FormGroup;

  tiposConta = [
    { value: TipoConta.ContaCorrente.toString(),   label: 'Conta corrente' },
    { value: TipoConta.Poupança.toString(),    label: 'Poupança' },
    { value: TipoConta.Investimento.toString(), label: 'Investimento' },
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
      nome:      ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      tipo:      [TipoConta.ContaCorrente.toString()],
      nomeBanco: ['', Validators.maxLength(80)],
      agencia:   ['', Validators.maxLength(8)],
      saldoInicial: [0, [Validators.min(0), Validators.max(99999999.99)]],
      cor:           ['#3b82f6'],
    });
  }

  private criarFormularioTransferencia(){
    this.formTransferencia = this.formBuilder.group({
      deContaId: [null as number | null, Validators.required],
      paraContaId:   [null as number | null, Validators.required],
      valor:          [null as number | null, [Validators.required, Validators.min(0.01), Validators.max(99999999.99)]],
      descricao:     ['Transferência entre contas', [Validators.required, Validators.maxLength(100)]],
      data:            [new Date().toISOString().split('T')[0], Validators.required],
    });
  }

  private _load(): void {
    const id = this.empresaService.ativoId();
    if (!id) { this.carregando = false; return; }

    this._subscriptions.push(
      this.contaService.listarContas(id).pipe(
        handleApiError(this.toast, 'Erro ao carregar contas.')
      ).subscribe({
        next:  res => { this.contas = res; this.carregando = false; },
        error: ()   => { this.carregando = false; },
      })
    );
  }

  abrirCriarConta(): void {
    this.modoEdicao = false;
    this.contaEditandoId = null;
    this.formConta.reset({ tipo: TipoConta.ContaCorrente.toString(), saldoInicial: 0, cor: '#3b82f6' });
    this.showModal = true;
  }

  abrirEditar(conta: Conta): void {
    this.modoEdicao = true;
    this.contaEditandoId = conta.id;
    this.formConta.reset({
      nome:         conta.nome,
      tipo:         conta.tipo.toString(),
      nomeBanco:    (conta as any).nomeBanco ?? '',
      agencia:      (conta as any).agencia ?? '',
      saldoInicial: conta.saldoAtual,
      cor:          conta.cor ?? '#3b82f6',
    });
    this.showModal = true;
  }

  fecharModal(): void {
    this.showModal = false;
    this.modoEdicao = false;
    this.contaEditandoId = null;
  }

  onSubmit(): void {
    if (this.formConta.invalid) { this.formConta.markAllAsTouched(); return; }
    const empresaId = this.empresaService.ativoId();
    if (!empresaId) return;

    this.enviando = true;

    const v = this.formConta.value;
    const operacao = this.modoEdicao && this.contaEditandoId != null
      ? this.contaService.atualizarConta(empresaId, this.contaEditandoId, {
          nome:      v.nome,
          tipo:      v.tipo,
          saldoAtual: Number(v.saldoInicial),
          nomeBanco: v.nomeBanco,
          agencia:   v.agencia,
          cor:       v.cor,
        } as any)
      : this.contaService.criarConta(empresaId, v as Conta);

    const mensagem = this.modoEdicao ? 'Conta atualizada com sucesso!' : 'Conta criada com sucesso!';

    this._subscriptions.push(
      operacao.pipe(
        handleApiError(this.toast, this.modoEdicao ? 'Erro ao atualizar conta.' : 'Erro ao criar conta.')
      ).subscribe({
        next: () => {
          this.toast.success(mensagem);
          this.enviando = false;
          this.fecharModal();
          this._load();
        },
        error: () => { this.enviando = false; },
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

    this._subscriptions.push(
      this.contaService.transferirConta(id, {
        deContaId:   v.deContaId!,
        paraContaId: v.paraContaId!,
        valor:       Number(v.valor),
        descricao:   v.descricao ?? null,
        data:        v.data!,
      }).pipe(
        handleApiError(this.toast, 'Erro ao realizar transferência.')
      ).subscribe({
        next: () => {
          this.toast.success('Transferência realizada com sucesso!');
          this.transferindo = false;
          this.fecharTransferencia();
          this._load();
        },
        error: () => { this.transferindo = false; },
      })
    );
  }

  abrirConfirmDelete(conta: Conta): void {
    this.contaParaDesativar = conta;
    this.showConfirmDelete  = true;
  }

  fecharConfirmDelete(): void {
    this.showConfirmDelete  = false;
    this.contaParaDesativar = null;
  }

  confirmarDesativacao(): void {
    const conta = this.contaParaDesativar;
    const id    = this.empresaService.ativoId();
    if (!conta || !id) return;

    this.enviando = true;
    this._subscriptions.push(
      this.contaService.deletarConta(id, conta.id).pipe(
        handleApiError(this.toast, 'Erro ao desativar conta.')
      ).subscribe({
        next: () => {
          this.toast.success('Conta desativada.');
          this.enviando = false;
          this.fecharConfirmDelete();
          this._load();
        },
        error: () => { this.enviando = false; },
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
