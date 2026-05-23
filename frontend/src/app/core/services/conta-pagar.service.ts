import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AtualizarContaPagarDto, ContaPagar, CriarContaPagarDto, RequisicaoPagamento, ResumoContasAPagar } from '../models/conta-pagar.model';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RespostaApi, RespostaPaginada } from '../models/resposta-api';

@Injectable({ providedIn: 'root' })
export class ContaPagarService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private base(empresaId: number): string {
    return `${this.API}/empresas/${empresaId}/contas-pagar`;
  }

  listarContasPagar(empresaId: number, params: {
    status?: string; date_from?: string; date_to?: string;
    page?: number; per_page?: number; pesquisa?: string;
  } = {}): Observable<RespostaPaginada<ContaPagar>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return this.http.get<RespostaPaginada<ContaPagar>>(this.base(empresaId), { params: p });
  }

  criarContaPagar(empresaId: number, data: CriarContaPagarDto): Observable<ContaPagar[]> {
    return this.http.post<RespostaApi<ContaPagar[]>>(this.base(empresaId), data).pipe(
      map(r => r.conteudo),
    );
  }

  atualizarContaPagar(empresaId: number, id: number, data: AtualizarContaPagarDto): Observable<ContaPagar> {
    return this.http.put<RespostaApi<ContaPagar>>(`${this.base(empresaId)}/${id}`, data).pipe(
      map(r => r.conteudo),
    );
  }

  pagarContaPagar(empresaId: number, id: number, data: RequisicaoPagamento): Observable<ContaPagar> {
    return this.http.post<RespostaApi<ContaPagar>>(`${this.base(empresaId)}/${id}/pagar`, data).pipe(
      map(r => r.conteudo),
    );
  }

  deletarContaPagar(empresaId: number, id: number): Observable<null> {
    return this.http.delete<RespostaApi<null>>(`${this.base(empresaId)}/${id}`).pipe(
      map(r => r.conteudo),
    );
  }

  obterResumoContaPagar(empresaId: number): Observable<ResumoContasAPagar> {
    return this.http.get<RespostaApi<ResumoContasAPagar>>(`${this.base(empresaId)}/resumo`).pipe(
      map(r => r.conteudo),
    );
  }
}
