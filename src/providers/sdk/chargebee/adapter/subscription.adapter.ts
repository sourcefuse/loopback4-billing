/* eslint-disable @typescript-eslint/naming-convention */
import {
  IAdapter,
  TSubscriptionCreate,
  TSubscriptionResult,
} from '../../../../types';

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
 *   adaptToModel(resp: unknown): TSubscriptionResult {
 *     const base = super.adaptToModel(resp);
 *     const raw = resp as {trial_end?: number};
 *     return {...base, trialEnd: raw.trial_end};
 *   }
 * }
 * // then:
 * service.chargebeeSubscriptionAdapter = new MyAdapter();
 * ```
 */
export class ChargebeeSubscriptionAdapter
  implements IAdapter<TSubscriptionResult, TSubscriptionCreate>
{
  /**
   * Maps a raw Chargebee Subscription object to the normalised
   * {@link TSubscriptionResult}.
   *
   * @param resp - Raw Chargebee Subscription returned by the SDK.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adaptToModel(resp: any): TSubscriptionResult {
    // NOSONAR
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adaptFromModel(data: Partial<TSubscriptionCreate>): any {
    return {
      subscription_items: data.priceRefId
        ? [{item_price_id: data.priceRefId}]
        : [],
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
