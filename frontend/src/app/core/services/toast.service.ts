import { Injectable } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  message: string;
  type: ToastType;
  visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toast: Toast = { message: '', type: 'info', visible: false };

  private _timer: ReturnType<typeof setTimeout> | null = null;

  show(message: string, type: ToastType = 'info', duration = 3500): void {
    if (this._timer) clearTimeout(this._timer);
    this.toast = { message, type, visible: true };
    this._timer = setTimeout(() => {
      this.toast = { ...this.toast, visible: false };
    }, duration);
  }

  success(message: string): void { this.show(message, 'success'); }
  error(message: string): void   { this.show(message, 'error'); }
  info(message: string): void    { this.show(message, 'info'); console.log(message)}
}