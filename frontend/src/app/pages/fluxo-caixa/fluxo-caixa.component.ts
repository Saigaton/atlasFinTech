import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransacaoService } from '../../core/services/transacao.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { ToastService } from '../../core/services/toast.service';
import { handleApiError } from '../../core/handlers/handle-api-error';
import { MesGrafico } from '../../core/models/dashboard.models';
import { ShellComponent } from '../../shared/components/shell/shell.component';

interface PontoFluxoCaixa {
  label:   string;
  receita: number;
  despesa: number;
  liquido: number;
}

const MONTH_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

@Component({
  selector: 'app-fluxo-caixa',
  standalone: true,
  imports: [CommonModule, FormsModule, ShellComponent],
  templateUrl: './fluxo-caixa.component.html',
  styleUrl: './fluxo-caixa.component.scss'
})
export class FluxoCaixaComponent implements OnInit {

  carregando     = true;
  anoSelecionado = new Date().getFullYear();
  readonly anos  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  private rawData: MesGrafico[] = [];

  get grafico(): PontoFluxoCaixa[] {
    return this.rawData.map(pt => {
      const rec = Number(pt.receitas) || 0;
      const des = Number(pt.despesas) || 0;
      return {
        label:   MONTH_LABELS[pt.mes - 1] ?? String(pt.mes),
        receita: rec,
        despesa: des,
        liquido: rec - des,
      };
    });
  }

  get totalReceita(): number { return this.rawData.reduce((s, p) => s + (Number(p.receitas) || 0), 0); }
  get totalDespesa(): number { return this.rawData.reduce((s, p) => s + (Number(p.despesas) || 0), 0); }
  get liquidoAtual(): number { return this.totalReceita - this.totalDespesa; }
  get valorMaximo(): number {
    return Math.max(...this.grafico.flatMap(p => [p.receita, p.despesa]), 1);
  }

  constructor(
    private empresaService:   EmpresaService,
    private transacaoService: TransacaoService,
    private toast:            ToastService,
  ) {}

  ngOnInit(): void { this._carregar(); }

  _carregar(): void {
    const id = this.empresaService.ativoId();
    if (!id) { this.carregando = false; return; }
    this.carregando = true;
    this.transacaoService.obterMesGrafico(id, this.anoSelecionado).pipe(
      handleApiError(this.toast, 'Erro ao carregar fluxo de caixa.')
    ).subscribe({
      next:  r  => { this.rawData = r ?? []; this.carregando = false; },
      error: ()  => { this.rawData = []; this.carregando = false; },
    });
  }

  fmt(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  fmtK(v: number): string {
    if (v >= 1_000) return 'R$' + (v / 1_000).toFixed(0) + 'k';
    return 'R$' + Math.round(v).toString();
  }
}
