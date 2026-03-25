import {IService, ISubscriptionService} from '../../../../types';

/**
 * Full Stripe service interface combining one-time billing ({@link IService})
 * and recurring-subscription management ({@link ISubscriptionService}).
 *
 * Implementors can bind to {@link BillingComponentBindings.SDKProvider} for
 * one-time billing OR to {@link BillingComponentBindings.SubscriptionProvider}
 * for subscription operations, depending on their needs (ISP).
 */
export interface IStripeService extends IService, ISubscriptionService {}

export * from './customer.type';
export * from './invoice.type';
export * from './payment-source.type';
export * from './stripe-config.type';
