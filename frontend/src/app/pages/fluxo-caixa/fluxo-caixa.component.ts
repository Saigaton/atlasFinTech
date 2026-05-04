import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransacaoService } from '../../core/services/transacao.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { UnsubscriberComponent } from '../../core/unsubscriber.component';
import { ShellComponent } from '../../shared/components/shell/shell.component';

const MONTH_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
@Component({
  selector: 'app-fluxo-caixa',
  standalone: true,
  imports: [CommonModule, FormsModule, ShellComponent],
  templateUrl: './fluxo-caixa.component.html',
  styleUrl: './fluxo-caixa.component.scss'
})
export class FluxoCaixaComponent extends UnsubscriberComponent implements OnInit {
  // ── Estado ───────────────────────────────────────────────────────────────
  carregando      = true;
  anoSelecionado = new Date().getFullYear();
  readonly anos = Array.from({ length: 5 }, (_, i) => this.anoSelecionado - i);

  private rawData: Array<{ mes: number; receita: number; despesa: number }> = [];

  // ── Dados computados ──────────────────────────────────────────────────────
  get grafico(): PontoFluxoCaixa[] {
    return this.rawData
      .filter(pt => pt.receita > 0 || pt.despesa > 0)
      .map(pt => ({
        label:   MONTH_LABELS[pt.mes - 1] ?? String(pt.mes),
        receita:  pt.receita,
        despesa: pt.despesa,
        liquido:     pt.receita - pt.despesa,
      }));
  }

  get totalReceita():  number { return this.rawData.reduce((s, p) => s + p.receita,  0); }
  get totalDespesa(): number { return this.rawData.reduce((s, p) => s + p.despesa, 0); }
  get liquidoAtual():   number { return this.totalReceita - this.totalDespesa; }
  get valorMaximo():     number {
    return Math.max(...this.grafico.flatMap(p => [p.receita, p.despesa]), 1);
  }

  constructor(
    private empresaService: EmpresaService,
    private transacaoService: TransacaoService,
  ) {
    super();
  }

  ngOnInit(): void { this.loadData(); }

  async loadData(): Promise<void> {
    this.carregando = true;
    const cid = this.empresaService.ativoId();
    if (!cid) { this.carregando = false; return; }
    try {
      const resp = await firstValueFrom(this.transacaoService.obterMesGrafico(cid, this.anoSelecionado));
      this.rawData = resp?.conteudo ?? [];
    } catch {
      this.rawData = [];
    }
    this.carregando = false;
  }

  fmt(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  fmtK(v: number): string {
    if (v >= 1000) return 'R$' + (v / 1000).toFixed(0) + 'k';
    return 'R$' + Math.round(v).toString();
  }
}
