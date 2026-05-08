import {TPaymentIntent, TPaymentMethod} from '../../../../types';
import {
  ChargebeeCard,
  ChargebeePaymentSource,
  ChargebeeTransaction,
} from '../type';

// Payment method default values
const DEFAULT_EXPIRY_MONTH = 12;
const DEFAULT_EXPIRY_YEAR = 2025;
const DEFAULT_FUNDING_TYPE = 'credit';
const DEFAULT_CARD_BRAND = 'unknown';

export class ChargebeePaymentIntentAdapter {
  constructor() {}

  /**
   * Adapts a ChargeBee transaction to the generic TPaymentIntent format.
   *
   * @param transaction - ChargeBee transaction object
   * @param paymentMethod - Optional payment method details
   * @returns TPaymentIntent - Normalized payment intent format
   */
  adaptToModel(
    transaction: ChargebeeTransaction,
    paymentMethod?: TPaymentMethod,
  ): TPaymentIntent {
    const currencyCode =
      ((transaction as Record<string, unknown>)['currency_code'] as
        | string
        | undefined) ??
      transaction.currencyCode ??
      'usd';
    const customerId =
      ((transaction as Record<string, unknown>)['customer_id'] as
        | string
        | undefined) ?? transaction.customerId;
    const amountCapturable = (transaction as Record<string, unknown>)[
      'amount_capturable'
    ] as number | undefined;
    const transactionType =
      ((transaction as Record<string, unknown>)['type'] as
        | string
        | undefined) ?? 'transaction';

    return {
      id: transaction.id ?? '',
      amount: transaction.amount ?? 0,
      currency: String(currencyCode).toLowerCase(),
      status: this.mapTransactionStatusToPaymentIntentStatus(
        transaction.status ?? 'in_progress',
      ),
      created:
        typeof transaction.date === 'string'
          ? Math.floor(new Date(transaction.date).getTime() / 1000)
          : (transaction.date ?? 0),
      customer: customerId,
      paymentMethod: paymentMethod,
      description: `ChargeBee ${transactionType} transaction`,
      latestCharge: transaction.id ?? '', // In ChargeBee, transaction is the charge
      clientSecret: undefined, // ChargeBee doesn't have client secret concept
      amountCapturable: amountCapturable,
      captureMethod: 'automatic', // ChargeBee default behavior
    };
  }

  /**
   * Maps ChargeBee transaction status to PaymentIntent status.
   *
   * ChargeBee transaction statuses: in_progress, success, voided, failure, timeout, needs_attention, late_failure
   * PaymentIntent statuses: requires_payment_method, requires_confirmation, requires_action, processing, requires_capture, canceled, succeeded
   *
   * @param transactionStatus - ChargeBee transaction status
   * @returns Corresponding PaymentIntent status
   */
  private mapTransactionStatusToPaymentIntentStatus(
    transactionStatus: string,
  ): string {
    switch (transactionStatus) {
      case 'in_progress':
        return 'processing';
      case 'success':
        return 'succeeded';
      case 'voided':
        return 'canceled';
      case 'failure':
        return 'canceled';
      case 'timeout':
        return 'canceled';
      case 'needs_attention':
        return 'requires_action';
      case 'late_failure':
        return 'canceled';
      default:
        return 'requires_payment_method';
    }
  }

  /**
   * Adapts a ChargeBee payment source to the generic TPaymentMethod format.
   */
  adaptPaymentSource(source: ChargebeePaymentSource): TPaymentMethod {
    if (source.type === 'card' && source.card) {
      return {
        type: 'card',
        id: source.id ?? '',
        customer: source.customerId,
        card: this.buildCardDetails(source.card),
      };
    }

    return {
      type: source.type ?? 'unknown',
      id: source.id ?? '',
      customer: source.customerId,
    };
  }

  /**
   * Builds card details object from ChargeBee card data.
   *
   * @param card - ChargeBee card information
   * @returns Formatted card details
   */
  private buildCardDetails(card: ChargebeeCard): {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    funding: string;
  } {
    return {
      brand: this.getCardBrand(card),
      last4: card.last4 ?? '****',
      expMonth: card.expiryMonth ?? DEFAULT_EXPIRY_MONTH,
      expYear: card.expiryYear ?? DEFAULT_EXPIRY_YEAR,
      funding: card.funding ?? DEFAULT_FUNDING_TYPE,
    };
  }

  /**
   * Gets card brand from first six digits.
   *
   * @param card - ChargeBee card information
   * @returns Card brand
   */
  private getCardBrand(card: ChargebeeCard): string {
    if (card.firstSixDigits) {
      return this.detectCardBrand(card.firstSixDigits);
    }
    return DEFAULT_CARD_BRAND;
  }

  /**
   * Detects card brand from first six digits.
   */
  private detectCardBrand(firstSix: string): string {
    if (firstSix.startsWith('4')) return 'visa';
    if (firstSix.startsWith('5') || firstSix.startsWith('2'))
      return 'mastercard';
    if (firstSix.startsWith('3')) return 'amex';
    return 'unknown';
  }

  /**
   * Creates a pending payment method object.
   *
   * @returns Payment method with pending status
   */
  createPendingPaymentMethod(): TPaymentMethod {
    return {
      type: 'pending',
      description: 'Payment not yet processed',
    } as TPaymentMethod;
  }

  /**
   * Creates an unknown payment method object.
   *
   * @param description - Description for the unknown payment method
   * @returns Payment method with unknown status
   */
  createUnknownPaymentMethod(description: string): TPaymentMethod {
    return {
      type: 'unknown',
      description,
    } as TPaymentMethod;
  }
}
