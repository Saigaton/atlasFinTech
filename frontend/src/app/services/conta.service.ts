import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Conta } from '../models/conta.model';

@Injectable({
  providedIn: 'root'
})
export class ContaService {
  private contas$ = new BehaviorSubject<Conta[]>([]);
  private contasObservable = this.contas$.asObservable();

  constructor() {
    this.carregarContas();
  }

  private carregarContas(): void {
    const contasArmazenadas = localStorage.getItem('contas');
    if (contasArmazenadas) {
      const contas = JSON.parse(contasArmazenadas);
      this.contas$.next(contas);
    }
  }

  getContas(): Observable<Conta[]> {
    return this.contasObservable;
  }

  adicionarConta(conta: Conta): void {
    const contasAtuais = this.contas$.value;
    const novasContas = [...contasAtuais, conta];
    this.contas$.next(novasContas);
    localStorage.setItem('contas', JSON.stringify(novasContas));
  }

  atualizarConta(contaAtualizada: Conta): void {
    const contasAtuais = this.contas$.value;
    const novasContas = contasAtuais.map(c => c.id === contaAtualizada.id ? contaAtualizada : c);
    this.contas$.next(novasContas);
    localStorage.setItem('contas', JSON.stringify(novasContas));
  }

  deletarConta(id: string): void {
    const contasAtuais = this.contas$.value;
    const novasContas = contasAtuais.filter(c => c.id !== id);
    this.contas$.next(novasContas);
    localStorage.setItem('contas', JSON.stringify(novasContas));
  }

  obterContaPorId(id: string): Conta | undefined {
    return this.contas$.value.find(c => c.id === id);
  }
}
