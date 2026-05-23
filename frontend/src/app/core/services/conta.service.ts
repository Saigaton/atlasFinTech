import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Conta } from '../models/conta.model';
import { RespostaApi } from '../models/resposta-api';

@Injectable({ providedIn: 'root' })
export class ContaService {
  private readonly API = environment.apiUrl;

  private base(empresaId: number): string {
    return `${this.API}/empresas/${empresaId}/contas`;
  }

  constructor(private http: HttpClient) {}

  listarContas(empresaId: number): Observable<Conta[]> {
    return this.http.get<RespostaApi<Conta[]>>(this.base(empresaId)).pipe(
      map(r => r.conteudo),
    );
  }

  criarConta(empresaId: number, data: Conta): Observable<Conta> {
    return this.http.post<RespostaApi<Conta>>(this.base(empresaId), data).pipe(
      map(r => r.conteudo),
    );
  }

  atualizarConta(empresaId: number, accountId: number, data: Conta): Observable<Conta> {
    return this.http.put<RespostaApi<Conta>>(`${this.base(empresaId)}/${accountId}`, data).pipe(
      map(r => r.conteudo),
    );
  }

  transferirConta(empresaId: number, dados: {
    deContaId: number;
    paraContaId: number;
    valor: number;
    descricao: string | null;
    data: string;
  }): Observable<void> {
    return this.http.post<RespostaApi<null>>(`${this.base(empresaId)}/transferir`, dados).pipe(
      map(() => undefined as void),
    );
  }

  deletarConta(empresaId: number, accountId: number): Observable<null> {
    return this.http.delete<RespostaApi<null>>(`${this.base(empresaId)}/${accountId}`).pipe(
      map(r => r.conteudo),
    );
  }
}
