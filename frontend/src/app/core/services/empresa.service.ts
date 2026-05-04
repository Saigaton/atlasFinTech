/**
 * Serviço de Empresas — Atlas FinTech.
 *
 * Gerencia a empresa ativa (multi-tenant):
 * - Signal _active: empresa selecionada persistida em localStorage
 * - activeId(): atalho para o ID da empresa ativa (null se nenhuma)
 * - clearActive(): chamado pelo ShellComponent antes do logout
 *
 * A empresa ativa é o contexto de todos os outros módulos financeiros.
 * Antes de qualquer operação financeira, o componente verifica activeId().
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Empresa } from '../models/usuario.model';

/**
 * Serviço de empresas — Atlas FinTech.
 *
 * Responsabilidades:
 * - Criar e listar empresas do usuário
 * - Manter empresa ativa selecionada via Signal
 * - Persistir a seleção no localStorage
 */
@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly API = `${environment.apiUrl}/api/v1`;

  /** Empresa atualmente selecionada */
  private _ativo: Empresa | null = this._carregarAtivo();

  get ativo(): Empresa | null {
    return this._ativo;
  }
  /** ID da empresa ativa — atalho para uso nos services dependentes */
  readonly ativoId = () => this.ativo?.id ?? null;

  constructor(private http: HttpClient) {}

  // ── API calls ──────────────────────────────────────────────────────────

  /** Cria uma empresa e seleciona automaticamente a nova */
  criarEmpresa(data: Empresa): Observable<Empresa> {
    return this.http.post<Empresa>(`${this.API}/empresas`, data).pipe(
      tap(res => {
        if (res) this.definirAtivo(res);
      }),
    );
  }

  /** Lista todas as empresas do usuário autenticado */
  listarEmpresas(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(`${this.API}/empresas`).pipe(
      tap(res => {
        if (res.length && !this._ativo) {
          this.definirAtivo(res[0]);
        }
      }),
    );
  }

  // ── Seleção de empresa ─────────────────────────────────────────────────

  /** Define a empresa ativa e persiste no localStorage */
  definirAtivo(empresa: Empresa): void {
    this._ativo = empresa;
    localStorage.setItem('atlas_empresa', JSON.stringify(empresa));
  }

  /** Limpa a empresa ativa (ex: no logout) */
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
