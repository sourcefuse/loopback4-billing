import { BindingKey, CoreBindings } from '@loopback/core';
import { BillingComponent } from './component';
import { IService } from './types';

/**
 * Binding keys used by this component.
 */
export namespace BillingComponentBindings {
  export const COMPONENT = BindingKey.create<BillingComponent>(
    `${CoreBindings.COMPONENTS}.BillingComponent`,
  );
  export const BillingProvider =
    BindingKey.create<IService>(
        'sf.billing',
      );
  export const SDKProvider =
    BindingKey.create<IService>(
        'sf.billing.sdk',
      );
  export const RestProvider =
    BindingKey.create<IService>(
        'sf.billing.rest',
      );
}
