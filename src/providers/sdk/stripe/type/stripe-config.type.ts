import Stripe from 'stripe';
export interface StripeConfig {
  secretKey: string;
  /**
   * Controls how Stripe handles payment during subscription creation.
   * Defaults to `'default_incomplete'` (SCA-compliant: subscription starts
   * incomplete until the first payment is confirmed).
   *
   * Set to `'allow_incomplete'` or `'error_if_incomplete'` to change the
   * behaviour for your integration.
   *
   * @see https://stripe.com/docs/api/subscriptions/create#create_subscription-payment_behavior
   */
  defaultPaymentBehavior?: Stripe.SubscriptionCreateParams.PaymentBehavior;
}
