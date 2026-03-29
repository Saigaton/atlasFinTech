import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransacaoService } from '../../services/transacao.service';
import { Transacao } from '../../models/transacao.model';

@Component({
  selector: 'app-analise',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analise.component.html',
  styleUrl: './analise.component.css'
})
export class AnaliseComponent implements OnInit {
  dataInicial = '';
  dataFinal = '';
  transacoes: Transacao[] = [];

  constructor(private transacaoService: TransacaoService) {}

  ngOnInit(): void {
    this.definirPeriodoPadrao();
    this.carregarTransacoes();
  }

  private definirPeriodoPadrao(): void {
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
    });
  }

  aplicarFiltro(): void {
    // Filtro aplicado automaticamente no template
  }

  getTransacoesFiltrads(): Transacao[] {
    const dataIni = new Date(this.dataInicial);
    const dataFim = new Date(this.dataFinal);

    return this.transacoes.filter(t => {
      const dataTrans = new Date(t.data);
      return dataTrans >= dataIni && dataTrans <= dataFim;
    });
  }

  getReceitasTotal(): number {
    return this.getTransacoesFiltrads()
      .filter(t => t.tipo === 'Receita')
      .reduce((total, t) => total + t.valor, 0);
  }

  getDespesasTotal(): number {
    return this.getTransacoesFiltrads()
      .filter(t => t.tipo === 'Despesa')
      .reduce((total, t) => total + t.valor, 0);
  }

  getFluxoLiquido(): number {
    return this.getReceitasTotal() - this.getDespesasTotal();
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  getPercentualReceitas(): number {
    const total = this.getReceitasTotal() + this.getDespesasTotal();
    return total > 0 ? (this.getReceitasTotal() / total) * 100 : 0;
  }

  getPercentualDespesas(): number {
    const total = this.getReceitasTotal() + this.getDespesasTotal();
    return total > 0 ? (this.getDespesasTotal() / total) * 100 : 0;
  }
}
