import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransacaoService } from '../../core/services/transacao.service';
import { TipoTransacao, Transacao } from '../../core/models/transacao.model';

@Component({
  selector: 'app-fluxo-caixa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fluxo-caixa.component.html',
  styleUrl: './fluxo-caixa.component.css'
})
export class FluxoCaixaComponent implements OnInit {
  dataInicial = '';
  dataFinal = '';
  receitas = 0;
  despesas = 0;
  saldo = 0;
  fluxoLiquido = 0;
  transacoes: Transacao[] = [];
  tipoTransacao = TipoTransacao;

  constructor(private transacaoService: TransacaoService) {}

  ngOnInit(): void {
    this.definirPeriodiPadrao();
    this.carregarTransacoes();
  }

  private definirPeriodiPadrao(): void {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    this.dataInicial = this.formatarDataInput(primeiroDia);
    this.dataFinal = this.formatarDataInput(ultimoDia);
  }

  private formatarDataInput(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private carregarTransacoes(): void {
    this.transacaoService.getTransacoes().subscribe(transacoes => {
      this.transacoes = transacoes;
      this.calcularFluxo();
    });
  }

  private calcularFluxo(): void {
    const dataIni = new Date(this.dataInicial);
    const dataFim = new Date(this.dataFinal);

    const transacoesFiltradas = this.transacoes.filter(t => {
      const dataTrans = new Date(t.data);
      return dataTrans >= dataIni && dataTrans <= dataFim;
    });

    this.receitas = transacoesFiltradas
      .filter(t => t.tipo === TipoTransacao.Receita)
      .reduce((total, t) => total + t.valor, 0);

    this.despesas = transacoesFiltradas
      .filter(t => t.tipo === TipoTransacao.Despesa)
      .reduce((total, t) => total + t.valor, 0);

    this.fluxoLiquido = this.receitas - this.despesas;
  }

  aplicarFiltro(): void {
    this.calcularFluxo();
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  getTransacoesFiltrads(): Transacao[] {
    const dataIni = new Date(this.dataInicial);
    const dataFim = new Date(this.dataFinal);

    return this.transacoes.filter(t => {
      const dataTrans = new Date(t.data);
      return dataTrans >= dataIni && dataTrans <= dataFim;
    });
  }
}
