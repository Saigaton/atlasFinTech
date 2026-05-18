import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AtualizarContaPagarDto, ContaPagar, CriarContaPagarDto, RequisicaoPagamento, ResumoContasAPagar } from '../models/conta-pagar.model';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RespostaApi, RespostaPaginada } from '../models/resposta-api';

@Injectable({
  providedIn: 'root'
})
export class ContaPagarService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private base(empresaId: number): string {
    return `${this.API}/empresas/${empresaId}/contas-pagar`;
  }

  // ── Contas a Pagar ────────────────────────────────────────────────────

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

  criarContaPagar(empresaId: number, data: CriarContaPagarDto): Observable<RespostaApi<ContaPagar[]>> {
    return this.http.post<RespostaApi<ContaPagar[]>>(this.base(empresaId), data);
  }

  atualizarContaPagar(empresaId: number, id: number, data: AtualizarContaPagarDto): Observable<RespostaApi<ContaPagar>> {
    return this.http.put<RespostaApi<ContaPagar>>(`${this.base(empresaId)}/${id}`, data);
  }

  pagarContaPagar(empresaId: number, id: number, data: RequisicaoPagamento): Observable<RespostaApi<ContaPagar>> {
    return this.http.post<RespostaApi<ContaPagar>>(`${this.base(empresaId)}/${id}/pagar`, data);
  }

  deletarContaPagar(empresaId: number, id: number): Observable<RespostaApi<null>> {
    return this.http.delete<RespostaApi<null>>(`${this.base(empresaId)}/${id}`);
  }

  obterResumoContaPagar(empresaId: number): Observable<RespostaApi<ResumoContasAPagar>> {
    return this.http.get<RespostaApi<ResumoContasAPagar>>(`${this.base(empresaId)}/resumo`);
  }
}
