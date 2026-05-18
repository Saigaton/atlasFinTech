import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AtualizarContaReceberDto, ContaReceber, CriarContaReceberDto, RequisicaoRecebimento, ResumoContasAReceber } from '../models/conta-receber.model';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RespostaApi, RespostaPaginada } from '../models/resposta-api';

@Injectable({
  providedIn: 'root'
})
export class ContaReceberService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private base(empresaId: number): string {
    return `${this.API}/empresas/${empresaId}/contas-receber`;
  }

  listarContasReceber(empresaId: number, params: {
    status?: string; pesquisa?: string; date_from?: string; date_to?: string;
    page?: number; per_page?: number;
  } = {}): Observable<RespostaPaginada<ContaReceber>> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return this.http.get<RespostaPaginada<ContaReceber>>(this.base(empresaId), { params: p });
  }

  criarContaReceber(empresaId: number, data: CriarContaReceberDto): Observable<RespostaApi<ContaReceber>> {
    return this.http.post<RespostaApi<ContaReceber>>(this.base(empresaId), data);
  }

  atualizarContaReceber(empresaId: number, id: number, data: AtualizarContaReceberDto): Observable<RespostaApi<ContaReceber>> {
    return this.http.put<RespostaApi<ContaReceber>>(`${this.base(empresaId)}/${id}`, data);
  }

  receberContaReceber(empresaId: number, id: number, data: RequisicaoRecebimento): Observable<RespostaApi<ContaReceber>> {
    return this.http.post<RespostaApi<ContaReceber>>(`${this.base(empresaId)}/${id}/receber`, data);
  }

  deletarContaReceber(empresaId: number, id: number): Observable<RespostaApi<null>> {
    return this.http.delete<RespostaApi<null>>(`${this.base(empresaId)}/${id}`);
  }

  obterResumoContaReceber(empresaId: number): Observable<RespostaApi<ResumoContasAReceber>> {
    return this.http.get<RespostaApi<ResumoContasAReceber>>(`${this.base(empresaId)}/resumo`);
  }
}
