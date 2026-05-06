/**
 * Assistente IA — Atlas FinTech.
 *
 * Interface de chat que delega TODA a lógica de negócio ao endpoint
 * POST /companies/{id}/chatbot do backend (AnaliseService.enviarMensagemChat).
 * O backend já implementa 7 intenções com dados reais via regras.
 */
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShellComponent } from '../../shared/components/shell/shell.component';
import { EmpresaService } from '../../core/services/empresa.service';
import { AnaliseService } from '../../core/services/analise.service';
import { MensagemChat, SugestaoChat } from '../../core/models/assistente-ia.model';
import { firstValueFrom } from 'rxjs';

const SUGESTOES: SugestaoChat[] = [
  { icone: 'M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14c1.1 0 2 .9 2 2v1h-9z',                                                      texto: 'Qual é meu saldo total atual?' },
  { icone: 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z',                                                                texto: 'Como foi o mês?' },
  { icone: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z',                                                          texto: 'O que tenho a pagar?' },
  { icone: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM9 17H7v-7h2v7z',                                                            texto: 'Há algum problema?' },
  { icone: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21z',                                              texto: 'Como está minha margem?' },
  { icone: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',          texto: 'Últimas transações' },
  { icone: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5z',        texto: 'Projeção do próximo mês?' },
  { icone: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85z',                                                                           texto: 'O que tenho a receber?' },
];

@Component({
  selector: 'app-assistente-ia',
  standalone: true,
  imports: [CommonModule, FormsModule, ShellComponent],
  templateUrl: './assistente-ia.component.html',
  styleUrl: './assistente-ia.component.scss',
})
export class AssistenteIaComponent implements OnInit {
  @ViewChild('fimMensagens') private fimMensagens!: ElementRef;

  mensagens:   MensagemChat[] = [];
  pensando     = false;
  textoEntrada = '';
  sugestoes    = SUGESTOES;

  constructor(
    private empresaService: EmpresaService,
    private analiseService: AnaliseService,
  ) {}

  ngOnInit(): void {
    this._adicionarRespostaBot(
      'Olá! Sou seu assistente financeiro inteligente. Tenho acesso ' +
      'aos seus dados em tempo real e posso responder sobre:\n\n' +
      '• Saldo das suas contas\n• Receitas e despesas do mês\n' +
      '• Contas a pagar/receber e vencidas\n• Alertas financeiros\n' +
      '• Projeção de fluxo de caixa\n• Últimas transações\n\n' +
      'Como posso ajudar você hoje?'
    );
  }

  async enviarMensagem(texto?: string): Promise<void> {
    const mensagem = (texto ?? this.textoEntrada).trim();
    if (!mensagem || this.pensando) return;
    this.textoEntrada = '';

    this.mensagens = [...this.mensagens, { papel: 'usuario', conteudo: mensagem, hora: this._agora() }];
    this.pensando = true;
    this._rolarParaBaixo();

    const id = this.empresaService.ativoId();
    if (!id) {
      this._adicionarRespostaBot('Para usar o assistente, selecione uma empresa ativa.');
      this.pensando = false;
      return;
    }

    try {
      const resposta = await firstValueFrom(this.analiseService.enviarMensagemChat(id, mensagem));
      this._adicionarRespostaBot(resposta.conteudo?.resposta ?? 'Não obtive resposta. Tente novamente.');
    } catch {
      this._adicionarRespostaBot('Ocorreu um erro ao consultar seus dados. Por favor, tente novamente.');
    }

    this.pensando = false;
    this._rolarParaBaixo();
  }

  limparConversa(): void {
    this.mensagens = [];
    this._adicionarRespostaBot('Conversa reiniciada. Como posso ajudar você?');
  }

  formatarConteudo(texto: string): string {
    return texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  private _adicionarRespostaBot(conteudo: string): void {
    this.mensagens = [...this.mensagens, { papel: 'assistente', conteudo, hora: this._agora() }];
  }

  private _agora(): string {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  private _rolarParaBaixo(): void {
    setTimeout(() => {
      this.fimMensagens?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }
}
