import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UnsubscriberBase implements OnDestroy {
  protected _subscriptions: Subscription[] = [];

  ngOnDestroy(): void {
    this._subscriptions.forEach(sub => sub.unsubscribe());
  }
}
