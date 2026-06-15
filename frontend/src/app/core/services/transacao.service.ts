import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespostaApi, RespostaPaginada } from '../models/resposta-api';
import { AtualizarTransacaoDto, CriarTransacaoDto, FiltroTransacao, Transacao } from '../models/transacao.model';
import { DashboardKPI, MesGrafico } from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class TransacaoService {
  private readonly API = environment.apiUrl;

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

  criarTransacao(empresaId: number, data: CriarTransacaoDto): Observable<Transacao> {
    return this.http.post<RespostaApi<Transacao>>(this.base(empresaId), data).pipe(
      map(r => r.conteudo),
    );
  }

  atualizarTransacao(empresaId: number, id: number, data: AtualizarTransacaoDto): Observable<Transacao> {
    return this.http.put<RespostaApi<Transacao>>(`${this.base(empresaId)}/${id}`, data).pipe(
      map(r => r.conteudo),
    );
  }

  deletarTransacao(empresaId: number, id: number): Observable<null> {
    return this.http.delete<RespostaApi<null>>(`${this.base(empresaId)}/${id}`).pipe(
      map(r => r.conteudo),
    );
  }

  gerarRecorrencia(empresaId: number, txId: number): Observable<Transacao[]> {
    return this.http.post<RespostaApi<Transacao[]>>(
      `${this.base(empresaId)}/${txId}/gerar-recorrencia`, null
    ).pipe(
      map(r => r.conteudo),
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────

  obterKpis(empresaId: number, mes?: number, ano?: number): Observable<DashboardKPI> {
    let params = new HttpParams();
    if (mes) params = params.set('mes', mes);
    if (ano) params = params.set('ano', ano);
    return this.http.get<RespostaApi<DashboardKPI>>(
      `${this.API}/empresas/${empresaId}/dashboard/kpis`, { params }
    ).pipe(map(r => r.conteudo));
  }

  obterTransacoesRecente(empresaId: number, limit = 8): Observable<Transacao[]> {
    return this.http.get<RespostaApi<Transacao[]>>(
      `${this.API}/empresas/${empresaId}/dashboard/transacoes-recentes`,
      { params: new HttpParams().set('limit', limit) }
    ).pipe(map(r => r.conteudo));
  }

  obterMesGrafico(empresaId: number, ano?: number): Observable<MesGrafico[]> {
    let params = new HttpParams();
    if (ano) params = params.set('ano', ano);
    return this.http.get<RespostaApi<MesGrafico[]>>(
      `${this.API}/empresas/${empresaId}/dashboard/grafico`, { params }
    ).pipe(map(r => r.conteudo));
  }

}
