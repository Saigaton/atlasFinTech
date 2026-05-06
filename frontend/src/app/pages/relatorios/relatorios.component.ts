import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmpresaService } from '../../core/services/empresa.service';
import { RelatorioService } from '../../core/services/relatorio.service';
import { ToastService } from '../../core/services/toast.service';
import { ResultadoConciliacao, StatusAgendamento } from '../../core/models/relatorio.model';
import { ShellComponent } from '../../shared/components/shell/shell.component';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ShellComponent],
  templateUrl: './relatorios.component.html',
  styleUrl: './relatorios.component.scss'
})
export class RelatoriosComponent implements OnInit {

  readonly tiposRelatorio = [
    { valor: 'transacoes',      rotulo: 'Transações' },
    { valor: 'fluxo-caixa',     rotulo: 'Fluxo de Caixa' },
    { valor: 'contas-pagar',    rotulo: 'Contas a Pagar' },
    { valor: 'contas-receber',  rotulo: 'Contas a Receber' },
    { valor: 'analise',         rotulo: 'Análise Financeira' },
    { valor: 'completo',        rotulo: 'Relatório Completo' },
  ];

  readonly hoje = new Date();
  readonly meses = [
    { v: 1,  l: 'Janeiro'  }, { v: 2,  l: 'Fevereiro' }, { v: 3,  l: 'Março'    },
    { v: 4,  l: 'Abril'    }, { v: 5,  l: 'Maio'      }, { v: 6,  l: 'Junho'    },
    { v: 7,  l: 'Julho'    }, { v: 8,  l: 'Agosto'    }, { v: 9,  l: 'Setembro' },
    { v: 10, l: 'Outubro'  }, { v: 11, l: 'Novembro'  }, { v: 12, l: 'Dezembro' },
  ];
  readonly anos = Array.from({ length: 5 }, (_, i) => this.hoje.getFullYear() - i);

  baixando              = '';
  enviandoEmail         = false;
  importando            = false;

  statusAgendamento:    StatusAgendamento | null = null;
  carregandoAgendamento = false;
  salvandoAgendamento   = false;

  conciliacao: ResultadoConciliacao | null = null;
  abaAtiva: 'relatorios' | 'conciliacao' | 'backup' | 'agendamento' = 'relatorios';

  formularioFiltro!:       FormGroup;
  formularioEmail!:        FormGroup;
  formularioAgendamento!:  FormGroup;

  constructor(
    private empresaService:   EmpresaService,
    private relatorioService: RelatorioService,
    private toast:            ToastService,
    private formBuilder:      FormBuilder,
  ) {}

  ngOnInit(): void {
    this.formularioFiltro = this.formBuilder.group({
      mes: [this.hoje.getMonth() + 1],
      ano: [this.hoje.getFullYear()],
    });
    this.formularioEmail = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
    this.formularioAgendamento = this.formBuilder.group({
      email:  ['', [Validators.required, Validators.email]],
      diaMes: [1,  [Validators.min(1),   Validators.max(28)]],
      hora:   [8,  [Validators.min(0),   Validators.max(23)]],
    });
    this._carregarStatusAgendamento();
  }

  private _carregarStatusAgendamento(): void {
    const id = this.empresaId;
    if (!id) return;
    this.carregandoAgendamento = true;
    this.relatorioService.obterStatusAgendamento(id).subscribe({
      next:  r  => { this.statusAgendamento = r.conteudo; this.carregandoAgendamento = false; },
      error: () => { this.carregandoAgendamento = false; },
    });
  }

  salvarAgendamento(): void {
    if (this.formularioAgendamento.invalid) { this.formularioAgendamento.markAllAsTouched(); return; }
    const id = this.empresaId;
    if (!id) return;
    const v = this.formularioAgendamento.value;
    this.salvandoAgendamento = true;
    this.relatorioService.inscreverEmailPeriodico(id, v.email!, v.diaMes!, v.hora!).subscribe({
      next:  res => {
        this.toast.success(res.mensagem || 'Relatório agendado com sucesso!');
        this.salvandoAgendamento = false;
        this._carregarStatusAgendamento();
      },
      error: err => { this.toast.error(err.error?.mensagem ?? 'Erro ao salvar.'); this.salvandoAgendamento = false; },
    });
  }

  cancelarAgendamento(): void {
    const id = this.empresaId;
    if (!id) return;
    this.relatorioService.cancelarEmailPeriodico(id).subscribe({
      next:  () => { this.toast.success('Envio periódico cancelado.'); this._carregarStatusAgendamento(); },
      error: () => this.toast.error('Erro ao cancelar.'),
    });
  }

  enviarAgora(): void {
    const id     = this.empresaId;
    const status = this.statusAgendamento;
    if (!id || !status?.email) return;
    this.relatorioService.dispararRelatorioAgora(id, status.email).subscribe({
      next:  res => this.toast.success(res.mensagem || 'Relatório enviado!'),
      error: err => this.toast.error(err.error?.mensagem ?? 'Erro ao enviar.'),
    });
  }

  get empresaId(): number | null { return this.empresaService.ativoId(); }

  // ── Downloads ──────────────────────────────────────────────────────────────

  gerarRapido(tipo: string): void {
    const mapa: Record<string, 'tx-csv' | 'pagar-csv' | 'receber-csv' | 'pdf' | 'backup'> = {
      transacoes:       'tx-csv',
      'fluxo-caixa':    'tx-csv',
      'contas-pagar':   'pagar-csv',
      'contas-receber': 'receber-csv',
      analise:          'pdf',
      completo:         'backup',
    };
    const destino = mapa[tipo] ?? 'tx-csv';
    if (destino === 'backup') { this.baixarBackup(); return; }
    this.baixar(destino as 'tx-csv' | 'pagar-csv' | 'receber-csv' | 'pdf');
  }

  baixar(tipo: 'tx-csv' | 'pagar-csv' | 'receber-csv' | 'pdf'): void {
    const id = this.empresaId;
    if (!id) return;
    const m = this.formularioFiltro.value.mes ?? undefined;
    const a = this.formularioFiltro.value.ano ?? undefined;
    this.baixando = tipo;

    const req$ = tipo === 'tx-csv'      ? this.relatorioService.baixarTransacoesCsv(id, m, a)
               : tipo === 'pagar-csv'   ? this.relatorioService.baixarContasPagarCsv(id)
               : tipo === 'receber-csv' ? this.relatorioService.baixarContasReceberCsv(id)
               :                          this.relatorioService.baixarPdf(id, m, a);

    const nomeArquivo = tipo === 'tx-csv'      ? 'transacoes.csv'
                      : tipo === 'pagar-csv'   ? 'contas_a_pagar.csv'
                      : tipo === 'receber-csv' ? 'contas_a_receber.csv'
                      :                          'relatorio.pdf';

    req$.subscribe({
      next:  blob => {
        this.relatorioService.dispararDownload(blob, nomeArquivo);
        this.toast.success(`${nomeArquivo} baixado com sucesso!`);
        this.baixando = '';
      },
      error: () => { this.toast.error('Erro ao gerar o arquivo.'); this.baixando = ''; },
    });
  }

  baixarBackup(): void {
    const id = this.empresaId;
    if (!id) return;
    this.baixando = 'backup';
    this.relatorioService.baixarBackup(id).subscribe({
      next:  blob => {
        this.relatorioService.dispararDownload(blob, 'atlas_backup.zip');
        this.toast.success('Backup gerado com sucesso!');
        this.baixando = '';
      },
      error: () => { this.toast.error('Erro ao gerar backup.'); this.baixando = ''; },
    });
  }

  // ── E-mail ─────────────────────────────────────────────────────────────────

  enviarEmail(): void {
    if (this.formularioEmail.invalid) { this.formularioEmail.markAllAsTouched(); return; }
    const id = this.empresaId;
    if (!id) return;
    const m = this.formularioFiltro.value.mes ?? undefined;
    const a = this.formularioFiltro.value.ano ?? undefined;
    this.enviandoEmail = true;
    this.relatorioService.enviarEmailRelatorio(id, this.formularioEmail.value.email!, m, a).subscribe({
      next:  res => {
        this.toast.success(res.mensagem || 'Relatório enviado!');
        this.enviandoEmail = false;
        this.formularioEmail.reset();
      },
      error: err => { this.toast.error(err.error?.mensagem ?? 'Erro ao enviar e-mail.'); this.enviandoEmail = false; },
    });
  }

  // ── Conciliação ────────────────────────────────────────────────────────────

  aoSelecionarExtrato(evento: Event): void {
    const arquivo = (evento.target as HTMLInputElement).files?.[0];
    if (!arquivo) return;
    const id = this.empresaId;
    if (!id) return;
    this.importando  = true;
    this.conciliacao = null;
    this.relatorioService.importarExtrato(id, arquivo).subscribe({
      next:  res => {
        this.conciliacao = res.conteudo;
        this.importando  = false;
        this.toast.success(`Conciliação concluída: ${res.conteudo.conciliadas} transações conciliadas.`);
      },
      error: err => { this.toast.error(err.error?.mensagem ?? 'Erro ao importar extrato.'); this.importando = false; },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  formatarMoeda(v: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  estaBaixando(chave: string): boolean { return this.baixando === chave; }

  percentualConciliacao(): number {
    if (!this.conciliacao?.totalExtrato) return 0;
    return Math.round((this.conciliacao.conciliadas / this.conciliacao.totalExtrato) * 100);
  }
}
