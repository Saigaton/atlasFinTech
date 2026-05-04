/**
 * Componente de Skeleton Loading — Atlas FinTech.
 *
 * Exibe placeholders animados durante carregamento de dados.
 * Substitui spinners centralizados por skeletons que preservam o layout.
 *
 * Uso:
 *   <app-loading-skeleton [rows]="5" [type]="'card'" />
 *
 * Tipos disponíveis:
 *   'card'  → grid de cards (contas, categorias)
 *   'table' → linhas de tabela (transações, auditoria)
 *   'kpi'   → cards de KPI (dashboard)
 */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-skeleton.component.html',
  styleUrl: './loading-skeleton.component.scss'
})
export class LoadingSkeletonComponent {
  @Input() rows = 4;
  @Input() type: 'card' | 'table' | 'kpi' = 'table';

  get rowArr(): number[] {
    return Array(this.rows).fill(0);
  }
}
