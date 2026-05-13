import Stripe from 'stripe';

/**
 * Card default values for when card data is missing from the provider response.
 * These should only be used as fallbacks when payment providers return incomplete data.
 */
export interface StripeCardDefaults {
  /** Default expiry month (1-12). Defaults to 12. */
  defaultExpiryMonth?: number;
  /** Default expiry year. Defaults to current year. */
  defaultExpiryYear?: number;
  /** Default funding type. Defaults to 'credit'. */
  defaultFundingType?: string;
  /** Default card brand. Defaults to 'unknown'. */
  defaultCardBrand?: string;
}

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
  /**
   * Card default values for fallback when provider returns incomplete card data.
   * These should rarely be needed with valid Stripe responses.
   */
  cardDefaults?: StripeCardDefaults;
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
