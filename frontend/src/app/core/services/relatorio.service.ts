import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespostaApi } from '../models/resposta-api';
import { StatusAgendamento, ResultadoConciliacao } from '../models/relatorio.model';

@Injectable({ providedIn: 'root' })
export class RelatorioService {
  private readonly API = `${environment.apiUrl}/api/v1`;

  constructor(private http: HttpClient) {}

  private base(empresaId: number): string {
    return `${this.API}/companies/${empresaId}/reports`;
  }

  obterStatusAgendamento(empresaId: number): Observable<RespostaApi<StatusAgendamento>> {
    return this.http.get<RespostaApi<StatusAgendamento>>(`${this.base(empresaId)}/schedule/status`);
  }

  inscreverEmailPeriodico(empresaId: number, email: string, diaMes: number, hora: number): Observable<RespostaApi<void>> {
    return this.http.post<RespostaApi<void>>(
      `${this.base(empresaId)}/schedule/subscribe`,
      { email, dia_mes: diaMes, hora },
    );
  }

  cancelarEmailPeriodico(empresaId: number): Observable<RespostaApi<void>> {
    return this.http.delete<RespostaApi<void>>(`${this.base(empresaId)}/schedule/unsubscribe`);
  }

  dispararRelatorioAgora(empresaId: number, email: string): Observable<RespostaApi<void>> {
    return this.http.post<RespostaApi<void>>(`${this.base(empresaId)}/schedule/trigger`, { email });
  }

  baixarTransacoesCsv(empresaId: number, mes?: number, ano?: number): Observable<Blob> {
    let params = new HttpParams();
    if (mes) params = params.set('month', mes);
    if (ano) params = params.set('year', ano);
    return this.http.get(`${this.base(empresaId)}/transactions/csv`, { params, responseType: 'blob' });
  }

  baixarContasPagarCsv(empresaId: number): Observable<Blob> {
    return this.http.get(`${this.base(empresaId)}/payables/csv`, { responseType: 'blob' });
  }

  baixarContasReceberCsv(empresaId: number): Observable<Blob> {
    return this.http.get(`${this.base(empresaId)}/receivables/csv`, { responseType: 'blob' });
  }

  baixarPdf(empresaId: number, mes?: number, ano?: number): Observable<Blob> {
    let params = new HttpParams();
    if (mes) params = params.set('month', mes);
    if (ano) params = params.set('year', ano);
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
    a.click();
    URL.revokeObjectURL(url);
  }

  enviarEmailRelatorio(empresaId: number, email: string, mes?: number, ano?: number): Observable<RespostaApi<void>> {
    let params = new HttpParams();
    if (mes) params = params.set('month', mes);
    if (ano) params = params.set('year', ano);
    return this.http.post<RespostaApi<void>>(`${this.base(empresaId)}/email`, { email }, { params });
  }

  importarExtrato(empresaId: number, arquivo: File): Observable<RespostaApi<ResultadoConciliacao>> {
    const form = new FormData();
    form.append('file', arquivo);
    return this.http.post<RespostaApi<ResultadoConciliacao>>(`${this.base(empresaId)}/conciliation`, form);
  }
}
