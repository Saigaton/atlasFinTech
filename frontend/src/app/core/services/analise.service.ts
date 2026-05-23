import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespostaApi } from '../models/resposta-api';
import {
  Alerta, DadosCalendario,
  DadosFluxoCaixa, AnaliseFinanceira,
} from '../models/analise.model';

@Injectable({ providedIn: 'root' })
export class AnaliseService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private base(empresaId: number): string {
    return `${this.API}/empresas/${empresaId}/analises`;
  }

  obterFluxoCaixa(empresaId: number, mesesAFrente = 3): Observable<DadosFluxoCaixa> {
    const params = new HttpParams().set('meses_frente', mesesAFrente);
    return this.http.get<RespostaApi<DadosFluxoCaixa>>(`${this.base(empresaId)}/fluxo-caixa`, { params }).pipe(
      map(r => r.conteudo),
    );
  }

  obterAnaliseFinanceira(empresaId: number, mes?: number, ano?: number): Observable<AnaliseFinanceira> {
    let params = new HttpParams();
    if (mes) params = params.set('mes', mes);
    if (ano) params = params.set('ano', ano);
    return this.http.get<RespostaApi<AnaliseFinanceira>>(`${this.base(empresaId)}/analise-financeira`, { params }).pipe(
      map(r => r.conteudo),
    );
  }

  obterAlertas(empresaId: number): Observable<Alerta[]> {
    return this.http.get<RespostaApi<Alerta[]>>(`${this.base(empresaId)}/alertas`).pipe(
      map(r => r.conteudo),
    );
  }

  enviarMensagemChat(empresaId: number, mensagem: string): Observable<{ resposta: string }> {
    return this.http.post<RespostaApi<{ resposta: string }>>(
      `${this.base(empresaId)}/chatbot`, { message: mensagem }
    ).pipe(
      map(r => r.conteudo),
    );
  }

  obterCalendario(empresaId: number, mes?: number, ano?: number): Observable<DadosCalendario> {
    let params = new HttpParams();
    if (mes) params = params.set('mes', mes);
    if (ano) params = params.set('ano', ano);
    return this.http.get<RespostaApi<DadosCalendario>>(`${this.base(empresaId)}/calendario`, { params }).pipe(
      map(r => r.conteudo),
    );
  }

  obterPrevisaoMes(empresaId: number): Observable<any> {
    return this.http.get<RespostaApi<any>>(`${this.base(empresaId)}/previsao`).pipe(
      map(r => r.conteudo),
    );
  }
}
