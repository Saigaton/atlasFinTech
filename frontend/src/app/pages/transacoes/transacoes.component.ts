import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransacaoService } from '../../services/transacao.service';
import { ContaService } from '../../services/conta.service';
import { Transacao } from '../../models/transacao.model';
import { Conta } from '../../models/conta.model';

@Component({
  selector: 'app-transacoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transacoes.component.html',
  styleUrl: './transacoes.component.css'
})
export class TransacoesComponent implements OnInit {
  transacoes: Transacao[] = [];
  contas: Conta[] = [];
  mostrarModal = false;
  editando = false;
  transacaoAtual: Transacao = this.criarTransacaoVazia();
  filtroTipo = 'Todas';
  filtroContaId = '';

  constructor(
    private transacaoService: TransacaoService,
    private contaService: ContaService
  ) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  private carregarDados(): void {
    this.contaService.getContas().subscribe(contas => {
      this.contas = contas;
    });

    this.transacaoService.getTransacoes().subscribe(transacoes => {
      this.transacoes = transacoes;
    });
  }

  private criarTransacaoVazia(): Transacao {
    return {
      id: '',
      contaId: '',
      tipo: 'Receita',
      descricao: '',
      valor: 0,
      data: new Date(),
      categoria: ''
    };
  }

  abrirModal(): void {
    this.editando = false;
    this.transacaoAtual = this.criarTransacaoVazia();
    this.mostrarModal = true;
  }

  editarTransacao(transacao: Transacao): void {
    this.editando = true;
    this.transacaoAtual = { ...transacao };
    this.mostrarModal = true;
  }

  fecharModal(): void {
    this.mostrarModal = false;
    this.transacaoAtual = this.criarTransacaoVazia();
  }

  salvarTransacao(): void {
    if (!this.transacaoAtual.contaId || !this.transacaoAtual.descricao || this.transacaoAtual.valor <= 0) {
      alert('Por favor, preencha todos os campos corretamente');
      return;
    }

    if (this.editando) {
      this.transacaoService.atualizarTransacao(this.transacaoAtual);
    } else {
      this.transacaoAtual.id = Date.now().toString();
      this.transacaoService.adicionarTransacao(this.transacaoAtual);
    }

    this.fecharModal();
  }

  deletarTransacao(id: string): void {
    if (confirm('Tem certeza que deseja deletar esta transação?')) {
      this.transacaoService.deletarTransacao(id);
    }
  }

  getTransacoesFiltrads(): Transacao[] {
    return this.transacoes.filter(t => {
      const filtroTipoOk = this.filtroTipo === 'Todas' || t.tipo === this.filtroTipo;
      const filtroContaOk = !this.filtroContaId || t.contaId === this.filtroContaId;
      return filtroTipoOk && filtroContaOk;
    });
  }

  getNomeConta(contaId: string): string {
    return this.contas.find(c => c.id === contaId)?.nome || 'Conta desconhecida';
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }
}
