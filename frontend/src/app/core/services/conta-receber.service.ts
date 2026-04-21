import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ContaReceber } from '../models/conta-receber.model';

@Injectable({
  providedIn: 'root'
})
export class ContaReceberService {
  private contasReceber$ = new BehaviorSubject<ContaReceber[]>([]);
  private contasReceberObservable = this.contasReceber$.asObservable();

  constructor() {
    this.carregarContasReceber();
  }

  private carregarContasReceber(): void {
    const contasReceberArmazenadas = localStorage.getItem('contasReceber');
    if (contasReceberArmazenadas) {
      const contasReceber = JSON.parse(contasReceberArmazenadas);
      this.contasReceber$.next(contasReceber);
    }
  }

  getContasReceber(): Observable<ContaReceber[]> {
    return this.contasReceberObservable;
  }

  adicionarContaReceber(contaReceber: ContaReceber): void {
    const contasAtuais = this.contasReceber$.value;
    const novasContas = [...contasAtuais, contaReceber];
    this.contasReceber$.next(novasContas);
    localStorage.setItem('contasReceber', JSON.stringify(novasContas));
  }

  atualizarContaReceber(contaReceberAtualizada: ContaReceber): void {
    const contasAtuais = this.contasReceber$.value;
    const novasContas = contasAtuais.map(c => c.id === contaReceberAtualizada.id ? contaReceberAtualizada : c);
    this.contasReceber$.next(novasContas);
    localStorage.setItem('contasReceber', JSON.stringify(novasContas));
  }

  deletarContaReceber(id: string): void {
    const contasAtuais = this.contasReceber$.value;
    const novasContas = contasAtuais.filter(c => c.id !== id);
    this.contasReceber$.next(novasContas);
    localStorage.setItem('contasReceber', JSON.stringify(novasContas));
  }
}
