import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContaReceberService } from '../../core/services/conta-receber.service';
import { ContaReceber, SituacaoReceber } from '../../core/models/conta-receber.model';

@Component({
  selector: 'app-contas-receber',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contas-receber.component.html',
  styleUrl: './contas-receber.component.css'
})
export class ContasReceberComponent implements OnInit {
  contasReceber: ContaReceber[] = [];
  mostrarModal = false;
  editando = false;
  contaReceberAtual: ContaReceber = this.criarContaReceberVazia();
  situacaoReceber = SituacaoReceber;

  constructor(private contaReceberService: ContaReceberService) {}

  ngOnInit(): void {
    this.carregarContasReceber();
  }

  private carregarContasReceber(): void {
    this.contaReceberService.getContasReceber().subscribe(contasReceber => {
      this.contasReceber = contasReceber;
    });
  }

  private criarContaReceberVazia(): ContaReceber {
    return {
      id: '',
      descricao: '',
      valor: 0,
      dataVencimento: new Date(),
      dataRecebimento: undefined,
      status: SituacaoReceber.Pendente,
      categoria: ''
    };
  }

  abrirModal(): void {
    this.editando = false;
    this.contaReceberAtual = this.criarContaReceberVazia();
    this.mostrarModal = true;
  }

  editarContaReceber(contaReceber: ContaReceber): void {
    this.editando = true;
    this.contaReceberAtual = { ...contaReceber };
    this.mostrarModal = true;
  }

  fecharModal(): void {
    this.mostrarModal = false;
    this.contaReceberAtual = this.criarContaReceberVazia();
  }

  salvarContaReceber(): void {
    if (!this.contaReceberAtual.descricao || this.contaReceberAtual.valor <= 0) {
      alert('Por favor, preencha todos os campos corretamente');
      return;
    }

    if (this.editando) {
      this.contaReceberService.atualizarContaReceber(this.contaReceberAtual);
    } else {
      this.contaReceberAtual.id = Date.now().toString();
      this.contaReceberService.adicionarContaReceber(this.contaReceberAtual);
    }

    this.fecharModal();
  }

  deletarContaReceber(id: string): void {
    if (confirm('Tem certeza que deseja deletar esta conta?')) {
      this.contaReceberService.deletarContaReceber(id);
    }
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  obterStatusClasse(status: SituacaoReceber): string {
    switch (status) {
      case SituacaoReceber.Pendente:
        return 'pendente';
      case SituacaoReceber.Atrasado:
        return 'atrasado';
      case SituacaoReceber.Recebido:
        return 'recebido';
    }
  }
}
