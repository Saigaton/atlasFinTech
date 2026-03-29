import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './relatorios.component.html',
  styleUrl: './relatorios.component.css'
})
export class RelatoriosComponent implements OnInit {
  relatorios = [
    {
      id: 1,
      nome: 'Relatório de Receitas',
      descricao: 'Análise completa de todas as receitas',
      data: new Date(),
      tipo: 'Receitas'
    },
    {
      id: 2,
      nome: 'Relatório de Despesas',
      descricao: 'Análise completa de todas as despesas',
      data: new Date(),
      tipo: 'Despesas'
    }
  ];

  constructor() {}

  ngOnInit(): void {}

  gerarRelatorio(tipo: string): void {
    alert(`Gerando relatório de ${tipo}...`);
  }

  baixarRelatorio(id: number): void {
    alert(`Baixando relatório ${id}...`);
  }
}
