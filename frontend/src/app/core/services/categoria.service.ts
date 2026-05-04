/**
 * Serviço de Categorias — Atlas FinTech.
 *
 * CRUD de categorias de transações por empresa.
 * Ao criar uma empresa, 11 categorias padrão são geradas automaticamente.
 *
 * Tipos de categoria:
 *   'income'  → apenas para receitas
 *   'expense' → apenas para despesas
 *   'both'    → aparece em ambos os tipos
 *
 * Endpoints:
 *   GET    /companies/{id}/categories        → list()
 *   POST   /companies/{id}/categories        → create()
 *   PATCH  /companies/{id}/categories/{id}   → update()
 *   DELETE /companies/{id}/categories/{id}   → delete()
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespostaApi } from '../models/resposta-api';
import { Categoria, TipoCategoria } from '../models/categoria.models';

/** Serviço de categorias — Atlas FinTech. */
@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly API = `${environment.apiUrl}/api/v1`;

  constructor(private http: HttpClient) {}

  private base(empresaId: number): string {
    return `${this.API}/empresas/${empresaId}/categorias`;
  }

  listarCategoria(empresaId: number, tipo?: TipoCategoria): Observable<RespostaApi<Categoria[]>> {
    const params = tipo ? `?tipo=${tipo}` : '';
    return this.http.get<RespostaApi<Categoria[]>>(`${this.base(empresaId)}${params}`);
  }

  criarCategoria(empresaId: number, data: Categoria): Observable<RespostaApi<Categoria>> {
    return this.http.post<RespostaApi<Categoria>>(this.base(empresaId), data);
  }

  atualizarCategoria(empresaId: number, id: number, data: Categoria): Observable<RespostaApi<Categoria>> {
    return this.http.patch<RespostaApi<Categoria>>(`${this.base(empresaId)}/${id}`, data);
  }

  deletarCategoria(empresaId: number, id: number): Observable<RespostaApi<null>> {
    return this.http.delete<RespostaApi<null>>(`${this.base(empresaId)}/${id}`);
  }
}
