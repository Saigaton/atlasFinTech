import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContaPagarService } from '../../services/conta-pagar.service';
import { ContaPagar, SituacaoPagar } from '../../models/conta-pagar.model';

@Component({
  selector: 'app-contas-pagar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contas-pagar.component.html',
  styleUrl: './contas-pagar.component.css'
})
export class ContasPagarComponent implements OnInit {
  contasPagar: ContaPagar[] = [];
  mostrarModal = false;
  editando = false;
  contaPagarAtual: ContaPagar = this.criarContaPagarVazia();
  situacaoPagar = SituacaoPagar;

  constructor(private contaPagarService: ContaPagarService) {}

  ngOnInit(): void {
    this.carregarContasPagar();
  }

  private carregarContasPagar(): void {
    this.contaPagarService.getContasPagar().subscribe(contasPagar => {
      this.contasPagar = contasPagar;
    });
  }

  private criarContaPagarVazia(): ContaPagar {
    return {
      id: '',
      descricao: '',
      valor: 0,
      dataVencimento: new Date(),
      dataPagamento: undefined,
      status: SituacaoPagar.Pendente,
      categoria: ''
    };
  }

  abrirModal(): void {
    this.editando = false;
    this.contaPagarAtual = this.criarContaPagarVazia();
    this.mostrarModal = true;
  }

  editarContaPagar(contaPagar: ContaPagar): void {
    this.editando = true;
    this.contaPagarAtual = { ...contaPagar };
    this.mostrarModal = true;
  }

  fecharModal(): void {
    this.mostrarModal = false;
    this.contaPagarAtual = this.criarContaPagarVazia();
  }

  salvarContaPagar(): void {
    if (!this.contaPagarAtual.descricao || this.contaPagarAtual.valor <= 0) {
      alert('Por favor, preencha todos os campos corretamente');
      return;
    }

    if (this.editando) {
      this.contaPagarService.atualizarContaPagar(this.contaPagarAtual);
    } else {
      this.contaPagarAtual.id = Date.now().toString();
      this.contaPagarService.adicionarContaPagar(this.contaPagarAtual);
    }

    this.fecharModal();
  }

  deletarContaPagar(id: string): void {
    if (confirm('Tem certeza que deseja deletar esta conta?')) {
      this.contaPagarService.deletarContaPagar(id);
    }
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  obterStatusClasse(status: SituacaoPagar): string {
    switch (status) {
      case SituacaoPagar.Pendente:
        return 'pendente';
      case SituacaoPagar.Atrasado:
        return 'atrasado';
      case SituacaoPagar.Pago:
        return 'pago';
    }
  }
}
