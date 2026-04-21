import { Injectable, signal, effect } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable(
    { providedIn: 'root' }
)
export class ThemeService {
  private _theme = signal<Theme>(
    (localStorage.getItem('atlas-theme') as Theme) ?? 'light'
  );

  readonly theme = this._theme.asReadonly();
  readonly isDark = () => this._theme() === 'dark';

  constructor() {
    // Aplica o tema ao documento sempre que mudar
    effect(() => {
      document.documentElement.setAttribute('data-theme', this._theme());
      localStorage.setItem('atlas-theme', this._theme());
    });
  }

  toggle(): void {
    this._theme.set(this._theme() === 'light' ? 'dark' : 'light');
  }
}