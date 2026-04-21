import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ContaPagar } from '../models/conta-pagar.model';

@Injectable({
  providedIn: 'root'
})
export class ContaPagarService {
  private contasPagar$ = new BehaviorSubject<ContaPagar[]>([]);
  private contasPagarObservable = this.contasPagar$.asObservable();

  constructor() {
    this.carregarContasPagar();
  }

  private carregarContasPagar(): void {
    const contasPagarArmazenadas = localStorage.getItem('contasPagar');
    if (contasPagarArmazenadas) {
      const contasPagar = JSON.parse(contasPagarArmazenadas);
      this.contasPagar$.next(contasPagar);
    }
  }

  getContasPagar(): Observable<ContaPagar[]> {
    return this.contasPagarObservable;
  }

  adicionarContaPagar(contaPagar: ContaPagar): void {
    const contasAtuais = this.contasPagar$.value;
    const novasContas = [...contasAtuais, contaPagar];
    this.contasPagar$.next(novasContas);
    localStorage.setItem('contasPagar', JSON.stringify(novasContas));
  }

  atualizarContaPagar(contaPagarAtualizada: ContaPagar): void {
    const contasAtuais = this.contasPagar$.value;
    const novasContas = contasAtuais.map(c => c.id === contaPagarAtualizada.id ? contaPagarAtualizada : c);
    this.contasPagar$.next(novasContas);
    localStorage.setItem('contasPagar', JSON.stringify(novasContas));
  }

  deletarContaPagar(id: string): void {
    const contasAtuais = this.contasPagar$.value;
    const novasContas = contasAtuais.filter(c => c.id !== id);
    this.contasPagar$.next(novasContas);
    localStorage.setItem('contasPagar', JSON.stringify(novasContas));
  }
}
