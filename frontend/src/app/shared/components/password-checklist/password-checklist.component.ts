import { Component, Input, OnChanges, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PasswordRule {
  label: string;
  valid: boolean;
}

/**
 * Componente de checklist de requisitos de senha.
 *
 * Exibe 4 critérios visuais em tempo real enquanto o usuário digita.
 * Usa Angular Signals com computed() para recalcular automaticamente
 * sempre que o valor da senha mudar.
 *
 * Uso:
 *   <app-password-checklist [password]="passwordValue" />
 *
 * Utilizado em: RegisterComponent e ResetPasswordComponent.
 */
@Component({
  selector: 'app-password-checklist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './password-checklist.component.html',
  styleUrl: './password-checklist.component.scss'
})
export class PasswordChecklistComponent implements OnChanges {
  @Input() password = '';

  rules: PasswordRule[] = [];

  ngOnChanges(): void {
    const v = this.password;
    this.rules = [
      { label: 'Mínimo 8 caracteres', valid: v.length >= 8 },
      { label: 'Letra maiúscula',      valid: /[A-Z]/.test(v) },
      { label: 'Número',               valid: /[0-9]/.test(v) },
      { label: 'Caractere especial',   valid: /[^A-Za-z0-9]/.test(v) },
    ];
  }

  get allValid(): boolean {
    return this.rules.every(r => r.valid);
  }
}
