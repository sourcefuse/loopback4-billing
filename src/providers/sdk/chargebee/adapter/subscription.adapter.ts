/* eslint-disable @typescript-eslint/naming-convention */
import chargebee from 'chargebee';
import {
  IAdapter,
  TSubscriptionCreate,
  TSubscriptionResult,
} from '../../../../types';

/**
 * Local interface covering the Chargebee Subscription fields we map.
 * Chargebee does not export a typed subscription object from its SDK,
 * so we define the shape ourselves — no `any` needed.
 */
export interface RawChargebeeSubscription {
  id: string;
  status: string;
  customer_id: string;
  current_term_start?: number;
  current_term_end?: number;
  cancel_at_period_end?: boolean;
}

/**
 * Adapter that converts between the raw Chargebee Subscription object and the
 * provider-agnostic {@link TSubscriptionResult} shape used throughout the
 * library.
 *
 * Library consumers can subclass this adapter and re-assign
 * `service.chargebeeSubscriptionAdapter` to customise the mapping without
 * modifying {@link ChargeBeeService}.
 *
 * @example
 * ```ts
 * class MyAdapter extends ChargebeeSubscriptionAdapter {
 *   adaptToModel(resp: RawChargebeeSubscription & {trial_end?: number}): TSubscriptionResult {
 *     const base = super.adaptToModel(resp);
 *     return {...base, trialEnd: resp.trial_end};
 *   }
 * }
 * // then:
 * service.chargebeeSubscriptionAdapter = new MyAdapter();
 * ```
 */
export class ChargebeeSubscriptionAdapter implements IAdapter<
  TSubscriptionResult,
  TSubscriptionCreate
> {
  /**
   * Maps a raw Chargebee Subscription object to the normalised
   * {@link TSubscriptionResult}.
   *
   * @param resp - Raw Chargebee Subscription returned by the SDK.
   */
  adaptToModel(resp: RawChargebeeSubscription): TSubscriptionResult {
    return {
      id: resp.id,
      status: resp.status,
      customerId: resp.customer_id,
      currentPeriodStart: resp.current_term_start,
      currentPeriodEnd: resp.current_term_end,
      cancelAtPeriodEnd: resp.cancel_at_period_end ?? false,
    };
  }

  /**
   * Maps a {@link TSubscriptionCreate} to Chargebee `create_with_items`
   * parameters.
   *
   * @param data - Provider-agnostic subscription creation payload.
   */
  adaptFromModel(
    data: TSubscriptionCreate,
  ): Parameters<typeof chargebee.subscription.create_with_items>[1] {
    return {
      subscription_items: [{item_price_id: data.priceRefId}],
      discounts: [],
      ...(data.collectionMethod === 'send_invoice'
        ? {
            auto_collection: 'off' as const,
            ...(data.daysUntilDue !== undefined && {
              net_term_days: data.daysUntilDue,
            }),
          }
        : {auto_collection: 'on' as const}),
    };
  }
}
