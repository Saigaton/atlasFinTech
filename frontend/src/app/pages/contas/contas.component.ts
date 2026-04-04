import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContaService } from '../../services/conta.service';
import { Conta, TipoConta } from '../../models/conta.model';

@Component({
  selector: 'app-contas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contas.component.html',
  styleUrl: './contas.component.css'
})
export class ContasComponent implements OnInit {
  contas: Conta[] = [];
  mostrarModal = false;
  editando = false;
  contaAtual: Conta = this.criarContaVazia();

  constructor(private contaService: ContaService) {}

  ngOnInit(): void {
    this.carregarContas();
  }

  private carregarContas(): void {
    this.contaService.getContas().subscribe(contas => {
      this.contas = contas;
    });
  }

  private criarContaVazia(): Conta {
    return {
      id: '',
      nome: '',
      tipo: TipoConta.Banco,
      saldoInicial: 0,
      saldoAtual: 0,
      descricao: '',
      dataCriacao: new Date()
    };
  }

  abrirModal(): void {
    this.editando = false;
    this.contaAtual = this.criarContaVazia();
    this.mostrarModal = true;
  }

  editarConta(conta: Conta): void {
    this.editando = true;
    this.contaAtual = { ...conta };
    this.mostrarModal = true;
  }

  fecharModal(): void {
    this.mostrarModal = false;
    this.contaAtual = this.criarContaVazia();
  }

  salvarConta(): void {
    if (!this.contaAtual.nome) {
      alert('Por favor, preencha o nome da conta');
      return;
    }

    if (this.editando) {
      this.contaService.atualizarConta(this.contaAtual);
    } else {
      this.contaAtual.id = Date.now().toString();
      this.contaAtual.dataCriacao = new Date();
      this.contaAtual.saldoAtual = this.contaAtual.saldoInicial;
      this.contaService.adicionarConta(this.contaAtual);
    }

    this.fecharModal();
  }

  deletarConta(id: string): void {
    if (confirm('Tem certeza que deseja deletar esta conta?')) {
      this.contaService.deletarConta(id);
    }
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  getCorIcon(tipo: string): string {
    const cores: { [key: string]: string } = {
      'Banco': '🏦',
      'Cartão de Crédito': '💳',
      'Poupança': '🏦'
    };
    return cores[tipo] || '💰';
  }
}
