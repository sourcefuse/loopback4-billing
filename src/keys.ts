import {BindingKey, CoreBindings} from '@loopback/core';
import {BillingComponent} from './component';
import {IService, ISubscriptionService} from './types';

/**
 * Binding keys used by this component.
 */
export namespace BillingComponentBindings {
  export const COMPONENT = BindingKey.create<BillingComponent>(
    `${CoreBindings.COMPONENTS}.BillingComponent`,
  );
  export const BillingProvider = BindingKey.create<IService>('sf.billing');
  export const SDKProvider = BindingKey.create<IService>('sf.billing.sdk');
  export const RestProvider = BindingKey.create<IService>('sf.billing.rest');
  /**
   * Binding key for a provider that implements the full subscription lifecycle
   * ({@link ISubscriptionService}). Bind your extended StripeService (or any
   * other gateway implementation) here so controllers and services can inject
   * subscription capabilities independently of one-time billing.
   */
  export const SubscriptionProvider = BindingKey.create<ISubscriptionService>(
    'sf.billing.subscription',
  );
}
