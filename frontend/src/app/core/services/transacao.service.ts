/**
 * Serviço de Transações e KPIs — Atlas FinTech.
 *
 * Gerencia transações financeiras e dados do dashboard.
 *
 * Tipos de transação:
 *   'income'   → receita (aumenta saldo)
 *   'expense'  → despesa (diminui saldo)
 *   'transfer' → transferência entre contas (requer transfer_to_account_id)
 *
 * Status de transação:
 *   'pending'   → registrada mas não afeta saldo
 *   'confirmed' → impacta saldo imediatamente
 *   'cancelled' → soft delete, não afeta saldo
 *
 * Endpoints do dashboard:
 *   getKpis()          → KPIs com variação vs mês anterior
 *   getRecent()        → últimas N transações
 *   getmeslyChart()  → receita/despesa por mês (gráfico de barras)
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespostaApi, RespostaPaginada } from '../models/resposta-api';
import { FiltroTransacao, Transacao } from '../models/transacao.model';
import { DashboardKPI, MesGrafico } from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class TransacaoService {
  private readonly API = `${environment.apiUrl}/api/v1`;

  constructor(private http: HttpClient) {}

  private base(empresaId: number): string {
    return `${this.API}/empresas/${empresaId}/transacoes`;
  }

  // ── Transações ────────────────────────────────────────────────────────

  listarTransacoes(empresaId: number, filtro: FiltroTransacao = {}): Observable<RespostaPaginada<Transacao>> {
    let params = new HttpParams();
    Object.entries(filtro).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<RespostaPaginada<Transacao>>(this.base(empresaId), { params });
  }

  criarTransacao(empresaId: number, data: Transacao): Observable<RespostaApi<Transacao>> {
    return this.http.post<RespostaApi<Transacao>>(this.base(empresaId), data);
  }

  atualizarTransacao(empresaId: number, id: number, data: Transacao): Observable<RespostaApi<Transacao>> {
    return this.http.patch<RespostaApi<Transacao>>(`${this.base(empresaId)}/${id}`, data);
  }

  deletarTransacao(empresaId: number, id: number): Observable<RespostaApi<null>> {
    return this.http.delete<RespostaApi<null>>(`${this.base(empresaId)}/${id}`);
  }

  gerarRecorrencia(empresaId: number, txId: number): Observable<RespostaApi<Transacao[]>> {
    return this.http.post<RespostaApi<Transacao[]>>(
      `${this.base(empresaId)}/${txId}/gerar-recorrencia`, null
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────

  obterKpis(empresaId: number, mes?: number, ano?: number): Observable<RespostaApi<DashboardKPI>> {
    let params = new HttpParams();
    if (mes) params = params.set('mes', mes);
    if (ano)  params = params.set('ano', ano);
    return this.http.get<RespostaApi<DashboardKPI>>(
      `${this.API}/empresas/${empresaId}/dashboard/kpis`, { params }
    );
  }

  obterTransacoesRecente(empresaId: number, limit = 8): Observable<RespostaApi<Transacao[]>> {
    return this.http.get<RespostaApi<Transacao[]>>(
      `${this.API}/empresas/${empresaId}/dashboard/transacoes-recente`,
      { params: new HttpParams().set('limit', limit) }
    );
  }

  obterMesGrafico(empresaId: number, ano?: number): Observable<RespostaApi<MesGrafico[]>> {
    let params = new HttpParams();
    if (ano) params = params.set('ano', ano);
    return this.http.get<RespostaApi<MesGrafico[]>>(
      `${this.API}/empresas/${empresaId}/dashboard/grafico`, { params }
    );
  }

  obterGraficoPorConta(empresaId: number, ano?: number): Observable<RespostaApi<any[]>> {
    let params = new HttpParams();
    if (ano) params = params.set('ano', ano);
    return this.http.get<RespostaApi<any[]>>(
      `${this.API}/empresas/${empresaId}/dashboard/grafico-por-conta`, { params }
    );
  }
}