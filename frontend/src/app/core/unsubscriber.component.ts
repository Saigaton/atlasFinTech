import { OnDestroy } from "@angular/core";
import { Subscription } from "rxjs/internal/Subscription";

export class UnsubscriberComponent implements OnDestroy {
    protected _subscriptions: Subscription[] = [];
  
    ngOnDestroy(): void {
      this._subscriptions.forEach(sub => {
        sub.unsubscribe();
      });
    }
  }