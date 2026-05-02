import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Transacao } from '../models/transacao.model';
import { UnsubscriberComponent } from '../unsubscriber.component';

@Injectable({
  providedIn: 'root'
})
export class TransacaoService extends UnsubscriberComponent{
  private transacoes$ = new BehaviorSubject<Transacao[]>([]);
  private transacoesObservable = this.transacoes$.asObservable();

  constructor() {
    super();
    this.carregarTransacoes();
  }

  private carregarTransacoes(): void {
    const transacoesArmazenadas = localStorage.getItem('transacoes');
    if (transacoesArmazenadas) {
      const transacoes = JSON.parse(transacoesArmazenadas);
      this.transacoes$.next(transacoes);
    }
  }

  getTransacoes(): Observable<Transacao[]> {
    return this.transacoesObservable;
  }

  getTransacoesPorConta(contaId: string): Observable<Transacao[]> {
    return new Observable(observer => {
      this.transacoesObservable.subscribe(transacoes => {
        observer.next(transacoes.filter(t => t.contaId === contaId));
      });
    });
  }

  adicionarTransacao(transacao: Transacao): void {
    const transacoesAtuais = this.transacoes$.value;
    const novasTransacoes = [...transacoesAtuais, transacao];
    this.transacoes$.next(novasTransacoes);
    localStorage.setItem('transacoes', JSON.stringify(novasTransacoes));
  }

  atualizarTransacao(transacaoAtualizada: Transacao): void {
    const transacoesAtuais = this.transacoes$.value;
    const novasTransacoes = transacoesAtuais.map(t => t.id === transacaoAtualizada.id ? transacaoAtualizada : t);
    this.transacoes$.next(novasTransacoes);
    localStorage.setItem('transacoes', JSON.stringify(novasTransacoes));
  }

  deletarTransacao(id: string): void {
    const transacoesAtuais = this.transacoes$.value;
    const novasTransacoes = transacoesAtuais.filter(t => t.id !== id);
    this.transacoes$.next(novasTransacoes);
    localStorage.setItem('transacoes', JSON.stringify(novasTransacoes));
  }
}
