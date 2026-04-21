import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContaService } from '../../core/services/conta.service';
import { TransacaoService } from '../../core/services/transacao.service';
import { Conta } from '../../core/models/conta.model';
import { TipoTransacao, Transacao } from '../../core/models/transacao.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  contas: Conta[] = [];
  transacoes: Transacao[] = [];
  tipoTransacao = TipoTransacao;
  saldoTotal = 0;
  receitasTotal = 0;
  despesasTotal = 0;
  fluxoLiquido = 0;

  constructor(
    private contaService: ContaService,
    private transacaoService: TransacaoService
  ) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  private carregarDados(): void {
    this.contaService.getContas().subscribe(contas => {
      this.contas = contas;
      this.calcularSaldoTotal();
    });

    this.transacaoService.getTransacoes().subscribe(transacoes => {
      this.transacoes = transacoes;
      this.calcularTotais();
    });
  }

  private calcularSaldoTotal(): void {
    this.saldoTotal = this.contas.reduce((total, conta) => total + conta.saldoAtual, 0);
  }

  private calcularTotais(): void {
    this.receitasTotal = this.transacoes
      .filter(t => t.tipo === TipoTransacao.Receita)
      .reduce((total, t) => total + t.valor, 0);

    this.despesasTotal = this.transacoes
      .filter(t => t.tipo === TipoTransacao.Despesa)
      .reduce((total, t) => total + t.valor, 0);

    this.fluxoLiquido = this.receitasTotal - this.despesasTotal;
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  getTransacoesRecentes(): Transacao[] {
    return this.transacoes.slice(0, 5);
  }
}
