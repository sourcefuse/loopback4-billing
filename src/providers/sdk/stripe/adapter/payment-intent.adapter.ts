import Stripe from 'stripe';
import {PaymentStatus, TPaymentIntent, TPaymentMethod} from '../../../../types';

export class StripePaymentIntentAdapter {
  constructor() {}

  /**
   * Adapts a Stripe PaymentIntent to the generic TPaymentIntent format.
   *
   * @param paymentIntent - Stripe PaymentIntent object
   * @param paymentMethod - Optional payment method details
   * @returns TPaymentIntent - Normalized payment intent format
   */
  adaptToModel(
    paymentIntent: Stripe.PaymentIntent,
    paymentMethod?: TPaymentMethod,
  ): TPaymentIntent {
    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status as PaymentStatus,
      created: paymentIntent.created,
      customer: (paymentIntent.customer as string) ?? undefined,
      paymentMethod: paymentMethod,
      description: paymentIntent.description ?? undefined,
      metadata: paymentIntent.metadata as Record<string, string>,
      latestCharge: (paymentIntent.latest_charge as string) ?? undefined,
      clientSecret: paymentIntent.client_secret ?? undefined,
      amountCapturable: paymentIntent.amount_capturable,
      captureMethod: paymentIntent.capture_method,
    };
  }
}
