import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespostaApi } from '../models/resposta-api';
import { StatusAgendamento, ResultadoConciliacao } from '../models/relatorio.model';

@Injectable({ providedIn: 'root' })
export class RelatorioService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private base(empresaId: number): string {
    return `${this.API}/empresas/${empresaId}/relatorios`;
  }

  obterStatusAgendamento(empresaId: number): Observable<StatusAgendamento> {
    return this.http.get<RespostaApi<StatusAgendamento>>(`${this.base(empresaId)}/agendamento/status`).pipe(
      map(r => r.conteudo),
    );
  }

  inscreverEmailPeriodico(empresaId: number, email: string, diaMes: number, hora: number): Observable<void> {
    return this.http.post<RespostaApi<void>>(
      `${this.base(empresaId)}/agendamento/inscrever`,
      { email, dia_mes: diaMes, hora },
    ).pipe(map(() => undefined as void));
  }

  cancelarEmailPeriodico(empresaId: number): Observable<void> {
    return this.http.delete<RespostaApi<void>>(`${this.base(empresaId)}/agendamento/cancelar`).pipe(
      map(() => undefined as void),
    );
  }

  dispararRelatorioAgora(empresaId: number, email: string): Observable<void> {
    return this.http.post<RespostaApi<void>>(`${this.base(empresaId)}/agendamento/disparar`, { email }).pipe(
      map(() => undefined as void),
    );
  }

  baixarTransacoesCsv(empresaId: number, mes?: number, ano?: number): Observable<Blob> {
    let params = new HttpParams();
    if (mes) params = params.set('mes', mes);
    if (ano) params = params.set('ano', ano);
    return this.http.get(`${this.base(empresaId)}/transacoes/csv`, { params, responseType: 'blob' });
  }

  baixarContasPagarCsv(empresaId: number, mes?: number, ano?: number): Observable<Blob> {
    let params = new HttpParams();
    if (mes) params = params.set('mes', mes);
    if (ano) params = params.set('ano', ano);
    return this.http.get(`${this.base(empresaId)}/contas-pagar/csv`, { params, responseType: 'blob' });
  }

  baixarContasReceberCsv(empresaId: number, mes?: number, ano?: number): Observable<Blob> {
    let params = new HttpParams();
    if (mes) params = params.set('mes', mes);
    if (ano) params = params.set('ano', ano);
    return this.http.get(`${this.base(empresaId)}/contas-receber/csv`, { params, responseType: 'blob' });
  }

  baixarPdf(empresaId: number, mes?: number, ano?: number): Observable<Blob> {
    let params = new HttpParams();
    if (mes) params = params.set('mes', mes);
    if (ano) params = params.set('ano', ano);
    return this.http.get(`${this.base(empresaId)}/pdf`, { params, responseType: 'blob' });
  }

  baixarBackup(empresaId: number): Observable<Blob> {
    return this.http.get(`${this.base(empresaId)}/backup`, { responseType: 'blob' });
  }

  dispararDownload(blob: Blob, nomeArquivo: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  enviarEmailRelatorio(empresaId: number, email: string, mes?: number, ano?: number): Observable<void> {
    let params = new HttpParams();
    if (mes) params = params.set('mes', mes);
    if (ano) params = params.set('ano', ano);
    return this.http.post<RespostaApi<void>>(`${this.base(empresaId)}/email`, { email }, { params }).pipe(
      map(() => undefined as void),
    );
  }

  importarExtrato(empresaId: number, arquivo: File): Observable<ResultadoConciliacao> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    return this.http.post<RespostaApi<ResultadoConciliacao>>(`${this.base(empresaId)}/conciliacao`, form).pipe(
      map(r => r.conteudo),
    );
  }
}
