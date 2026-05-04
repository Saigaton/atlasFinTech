/**
 * Serviço de Contas Bancárias — Atlas FinTech.
 *
 * CRUD de contas bancárias de uma empresa.
 * Saldo nunca é editado diretamente — o backend sempre calcula
 * via soma de transações confirmadas + saldo inicial.
 *
 * Endpoints:
 *   GET    /companies/{id}/accounts          → list()
 *   POST   /companies/{id}/accounts          → create()
 *   PATCH  /companies/{id}/accounts/{id}     → update()
 *   DELETE /companies/{id}/accounts/{id}     → delete()
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Conta } from '../models/conta.model';

/**
 * Serviço de contas bancárias — Atlas FinTech.
 * Regra crítica: saldo nunca editado diretamente — sempre calculado pelo backend.
 */
@Injectable({ providedIn: 'root' })
export class ContaService {
  private readonly API = `${environment.apiUrl}/api/v1`;

  private base(empresaId: number): string {
    return `${this.API}/empresas/${empresaId}/contas`;
  }

  constructor(private http: HttpClient) {}

  /** Lista contas bancárias da empresa com saldo calculado. */
  listarContas(empresaId: number): Observable<Conta[]> {
    return this.http.get<Conta[]>(this.base(empresaId));
  }


  /** Cria nova conta bancária com saldo inicial opcional. */
  criarConta(empresaId: number, data: Conta): Observable<Conta> {
    return this.http.post<Conta>(this.base(empresaId), data);
  }


  /** Atualiza nome, tipo ou cor de uma conta bancária. */
  atualizarConta(empresaId: number, accountId: number, data: Conta): Observable<Conta> {
    return this.http.patch<Conta>(`${this.base(empresaId)}/${accountId}`, data);
  }


  /** Desativa uma conta bancária (soft delete). */
  deletarConta(empresaId: number, accountId: number): Observable<null> {
    return this.http.delete<null>(`${this.base(empresaId)}/${accountId}`);
  }
}
