import { Injectable, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs/internal/Subscription";
@Injectable({ providedIn: 'root' })
export class UnsubscriberComponent implements OnDestroy {
    protected _subscriptions: Subscription[] = [];
  
    ngOnDestroy(): void {
      this._subscriptions.forEach(sub => {
        sub.unsubscribe();
      });
    }
  }