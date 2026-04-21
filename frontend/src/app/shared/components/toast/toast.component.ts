import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast, ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="atlas-toast"
      [class]="toastService.toast.type"
      [class.show]="toastService.toast.visible"
    >
      {{ toastService.toast.message }}
    </div>
  `,
})
export class ToastComponent {
  constructor(protected toastService: ToastService) {}
}
