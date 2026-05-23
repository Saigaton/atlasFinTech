import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Empresa } from '../models/usuario.model';
import { RespostaApi } from '../models/resposta-api';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly API = environment.apiUrl;

  private _ativo: Empresa | null = this._carregarAtivo();

  get ativo(): Empresa | null { return this._ativo; }

  readonly ativoId = () => this.ativo?.id ?? null;

  constructor(private http: HttpClient) {}

  criarEmpresa(data: Empresa): Observable<Empresa> {
    return this.http.post<RespostaApi<Empresa>>(`${this.API}/empresas`, data).pipe(
      map(r => r.conteudo),
      tap(res => { if (res) this.definirAtivo(res); }),
    );
  }

  listarEmpresas(): Observable<Empresa[]> {
    return this.http.get<RespostaApi<Empresa[]>>(`${this.API}/empresas`).pipe(
      map(r => r.conteudo),
      tap(res => {
        if (res.length && !this._ativo) this.definirAtivo(res[0]);
      }),
    );
  }

  definirAtivo(empresa: Empresa): void {
    this._ativo = empresa;
    localStorage.setItem('atlas_empresa', JSON.stringify(empresa));
  }

  limparAtivo(): void {
    this._ativo = null;
    localStorage.removeItem('atlas_empresa');
  }

  private _carregarAtivo(): Empresa | null {
    try {
      const raw = localStorage.getItem('atlas_empresa');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
