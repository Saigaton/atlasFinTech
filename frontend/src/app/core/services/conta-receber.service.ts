import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ContaReceber, RequisicaoRecebimento, ResumoContasAReceber } from '../models/conta-receber.model';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RespostaApi, RespostaPaginada } from '../models/resposta-api';

@Injectable({
  providedIn: 'root'
})
export class ContaReceberService {
  private readonly API = `${environment.apiUrl}/api/v1`;

  constructor(private http: HttpClient) {}

  private base(empresaId: number): string {
    return `${this.API}/empresa/${empresaId}/contas-receber`;
  }

  // ── Contas a Receber ──────────────────────────────────────────────────

  listarContasReceber(empresaId: number, params: {
    status?: string; search?: string; date_from?: string; date_to?: string;
    page?: number; per_page?: number;
  } = {}): Observable<RespostaPaginada<ContaReceber>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return this.http.get<RespostaPaginada<ContaReceber>>(this.base(empresaId), { params: p });
  }

  criarContaReceber(empresaId: number, data: Partial<ContaReceber>): Observable<RespostaApi<ContaReceber>> {
    return this.http.post<RespostaApi<ContaReceber>>(this.base(empresaId), data);
  }

  atualizarContaReceber(empresaId: number, id: number, data: Partial<ContaReceber>): Observable<RespostaApi<ContaReceber>> {
    return this.http.patch<RespostaApi<ContaReceber>>(`${this.base(empresaId)}/${id}`, data);
  }

  receberContaReceber(empresaId: number, id: number, data: RequisicaoRecebimento): Observable<RespostaApi<ContaReceber>> {
    return this.http.post<RespostaApi<ContaReceber>>(`${this.base(empresaId)}/${id}/receive`, data);
  }

  deletarContaReceber(empresaId: number, id: number): Observable<RespostaApi<null>> {
    return this.http.delete<RespostaApi<null>>(`${this.base(empresaId)}/${id}`);
  }

  obterResumoContaReceber(empresaId: number): Observable<RespostaApi<ResumoContasAReceber>> {
    return this.http.get<RespostaApi<ResumoContasAReceber>>(`${this.base(empresaId)}/resumo`);
  }
}
