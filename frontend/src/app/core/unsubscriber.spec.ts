import { UnsubscriberBase } from './unsubscriber';
import { Subscription } from 'rxjs';

describe('UnsubscriberBase', () => {
  let base: UnsubscriberBase;

  beforeEach(() => { base = new UnsubscriberBase(); });

  it('deve iniciar com array de subscriptions vazio', () => {
    expect((base as any)._subscriptions).toEqual([]);
  });

  it('deve cancelar todas as subscriptions no ngOnDestroy', () => {
    const sub1 = jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']);
    const sub2 = jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']);
    (base as any)._subscriptions.push(sub1, sub2);

    base.ngOnDestroy();

    expect(sub1.unsubscribe).toHaveBeenCalledTimes(1);
    expect(sub2.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('não deve lançar erro quando não há subscriptions', () => {
    expect(() => base.ngOnDestroy()).not.toThrow();
  });

  it('deve cancelar somente as subscriptions registradas', () => {
    const sub = jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']);
    const naoRegistrado = jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']);
    (base as any)._subscriptions.push(sub);

    base.ngOnDestroy();

    expect(sub.unsubscribe).toHaveBeenCalled();
    expect(naoRegistrado.unsubscribe).not.toHaveBeenCalled();
  });
});
