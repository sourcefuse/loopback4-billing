import Stripe from 'stripe';
export interface StripeConfig {
  secretKey: string;
  /**
   * Global fallback for Stripe payment behaviour during subscription creation.
   * Defaults to `'default_incomplete'` when neither this nor a per-call
   * `TSubscriptionCreate.paymentBehavior` is provided.
   *
   * Per-call `paymentBehavior` on `TSubscriptionCreate` takes highest priority,
   * so different subscriptions can use different behaviours without changing
   * this global setting.
   *
   * @see https://stripe.com/docs/api/subscriptions/create#create_subscription-payment_behavior
   */
  defaultPaymentBehavior?: Stripe.SubscriptionCreateParams.PaymentBehavior;
}

/**
 * Stripe legacy Source object structure (for card-based payments)
 * Made more flexible to handle Stripe's CustomerSource union type
 */
export type StripeLegacySource = {
  id: string;
  type?: string;
  object?: string;
  card?: {
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    funding?: string;
  };
  customer?: string;
  metadata?: Record<string, string>;
  [key: string]: unknown;
};
