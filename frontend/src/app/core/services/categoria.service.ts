import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespostaApi } from '../models/resposta-api';
import { AtualizarCategoria, Categoria, CriarCategoria, TipoCategoria } from '../models/categoria.models';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private base(empresaId: number): string {
    return `${this.API}/empresas/${empresaId}/categorias`;
  }

  listarCategoria(empresaId: number, tipo?: TipoCategoria): Observable<Categoria[]> {
    const params = tipo ? `?tipo=${tipo}` : '';
    return this.http.get<RespostaApi<Categoria[]>>(`${this.base(empresaId)}${params}`).pipe(
      map(r => r.conteudo),
    );
  }

  criarCategoria(empresaId: number, data: CriarCategoria): Observable<Categoria> {
    return this.http.post<RespostaApi<Categoria>>(this.base(empresaId), data).pipe(
      map(r => r.conteudo),
    );
  }

  atualizarCategoria(empresaId: number, id: number, data: AtualizarCategoria): Observable<Categoria> {
    return this.http.put<RespostaApi<Categoria>>(`${this.base(empresaId)}/${id}`, data).pipe(
      map(r => r.conteudo),
    );
  }

  deletarCategoria(empresaId: number, id: number): Observable<null> {
    return this.http.delete<RespostaApi<null>>(`${this.base(empresaId)}/${id}`).pipe(
      map(r => r.conteudo),
    );
  }
}
