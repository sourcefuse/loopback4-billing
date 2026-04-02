/* eslint-disable @typescript-eslint/naming-convention */
import Stripe from 'stripe';
import {
  IAdapter,
  TSubscriptionCreate,
  TSubscriptionResult,
} from '../../../../types';

/**
 * Adapter that converts between the Stripe Subscription SDK object and the
 * provider-agnostic {@link TSubscriptionResult} shape used throughout the
 * library.
 *
 * Library consumers can subclass this adapter and re-bind it to customise the
 * mapping — e.g. to expose additional Stripe-specific fields — without
 * modifying {@link StripeService}.
 *
 * @example
 * ```ts
 * class MySubscriptionAdapter extends StripeSubscriptionAdapter {
 *   adaptToModel(resp: Stripe.Subscription): TSubscriptionResult {
 *     return { ...super.adaptToModel(resp), trialEnd: resp.trial_end };
 *   }
 * }
 * ```
 */
export class StripeSubscriptionAdapter implements IAdapter<
  TSubscriptionResult,
  TSubscriptionCreate
> {
  /**
   * Maps a raw Stripe Subscription object to the normalised
   * {@link TSubscriptionResult}.
   *
   * @param resp - Raw Stripe Subscription returned by the SDK.
   */
  adaptToModel(resp: Stripe.Subscription): TSubscriptionResult {
    const customerId = this.extractCustomerId(resp.customer);
    return {
      id: resp.id,
      status: resp.status,
      customerId,
      currentPeriodStart: resp.current_period_start,
      currentPeriodEnd: resp.current_period_end,
      cancelAtPeriodEnd: resp.cancel_at_period_end,
    };
  }

  /**
   * Maps a {@link TSubscriptionCreate} to the Stripe subscription create
   * parameters.
   *
   * @param data - Provider-agnostic subscription creation payload.
   */
  adaptFromModel(data: TSubscriptionCreate): Stripe.SubscriptionCreateParams {
    return {
      customer: data.customerId,
      items: [{price: data.priceRefId}],
      collection_method: data.collectionMethod,
      ...(data.daysUntilDue !== undefined && {
        days_until_due: data.daysUntilDue,
      }),
    };
  }

  /**
   * Extracts customer ID from Stripe customer field.
   * Handles string ID, expanded Customer object, and DeletedCustomer edge case.
   *
   * @param customer - Stripe customer field (string | Customer | DeletedCustomer)
   * @returns Customer ID or undefined if customer was deleted
   */
  private extractCustomerId(
    customer: string | Stripe.Customer | Stripe.DeletedCustomer,
  ): string | undefined {
    if (typeof customer === 'string') {
      return customer;
    }
    if (customer && 'id' in customer) {
      return customer.id;
    }
    return undefined;
  }
}
