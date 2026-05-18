import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespostaApi } from '../models/resposta-api';
import {
  Alerta, PaginaAuditoria, DadosCalendario,
  DadosFluxoCaixa, AnaliseFinanceira,
} from '../models/analise.model';

@Injectable({ providedIn: 'root' })
export class AnaliseService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private base(empresaId: number): string {
    return `${this.API}/empresas/${empresaId}/analises`;
  }

  obterFluxoCaixa(empresaId: number, mesesAFrente = 3): Observable<RespostaApi<DadosFluxoCaixa>> {
    const params = new HttpParams().set('meses_frente', mesesAFrente);
    return this.http.get<RespostaApi<DadosFluxoCaixa>>(`${this.base(empresaId)}/fluxo-caixa`, { params });
  }

  obterAnaliseFinanceira(empresaId: number, mes?: number, ano?: number): Observable<RespostaApi<AnaliseFinanceira>> {
    let params = new HttpParams();
    if (mes) params = params.set('mes', mes);
    if (ano) params = params.set('ano', ano);
    return this.http.get<RespostaApi<AnaliseFinanceira>>(`${this.base(empresaId)}/analise-financeira`, { params });
  }

  obterAlertas(empresaId: number): Observable<RespostaApi<Alerta[]>> {
    return this.http.get<RespostaApi<Alerta[]>>(`${this.base(empresaId)}/alertas`);
  }

  obterLogAuditoria(empresaId: number, pagina = 1, porPagina = 50): Observable<RespostaApi<PaginaAuditoria>> {
    const params = new HttpParams().set('pagina', pagina).set('por_pagina', porPagina);
    return this.http.get<RespostaApi<PaginaAuditoria>>(`${this.base(empresaId)}/log-auditoria`, { params });
  }

  enviarMensagemChat(empresaId: number, mensagem: string): Observable<RespostaApi<{ resposta: string }>> {
    return this.http.post<RespostaApi<{ resposta: string }>>(
      `${this.base(empresaId)}/chatbot`, { message: mensagem }
    );
  }

  obterCalendario(empresaId: number, mes?: number, ano?: number): Observable<RespostaApi<DadosCalendario>> {
    let params = new HttpParams();
    if (mes) params = params.set('mes', mes);
    if (ano) params = params.set('ano', ano);
    return this.http.get<RespostaApi<DadosCalendario>>(`${this.base(empresaId)}/calendario`, { params });
  }

  obterPrevisaoMes(empresaId: number): Observable<RespostaApi<any>> {
    return this.http.get<RespostaApi<any>>(`${this.base(empresaId)}/previsao`);
  }

  obterMetasOrcamentarias(empresaId: number, mes?: number, ano?: number): Observable<RespostaApi<any>> {
    let params = new HttpParams();
    if (mes) params = params.set('mes', mes);
    if (ano) params = params.set('ano', ano);
    return this.http.get<RespostaApi<any>>(`${this.base(empresaId)}/metas-orcamentarias`, { params });
  }

  salvarMetaOrcamentaria(empresaId: number, dados: {
    category_id: number; amount: number; month?: number; year?: number;
  }): Observable<RespostaApi<any>> {
    return this.http.post<RespostaApi<any>>(`${this.base(empresaId)}/metas-orcamentarias`, dados);
  }

  excluirMetaOrcamentaria(empresaId: number, metaId: number): Observable<RespostaApi<any>> {
    return this.http.delete<RespostaApi<any>>(`${this.base(empresaId)}/metas-orcamentarias/${metaId}`);
  }
}
