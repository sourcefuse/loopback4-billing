import {PaymentStatus, TPaymentIntent, TPaymentMethod} from '../../../../types';
import {
  ChargebeeCard,
  ChargebeePaymentSource,
  ChargebeeTransaction,
  ChargebeeCardDefaults,
} from '../type';

export class ChargebeePaymentIntentAdapter {
  private readonly cardDefaults: Required<ChargebeeCardDefaults>;

  constructor(cardDefaults?: ChargebeeCardDefaults) {
    const currentYear = new Date().getFullYear();
    this.cardDefaults = {
      defaultExpiryMonth: cardDefaults?.defaultExpiryMonth ?? 12,
      defaultExpiryYear: cardDefaults?.defaultExpiryYear ?? currentYear,
      defaultFundingType: cardDefaults?.defaultFundingType ?? 'credit',
      defaultCardBrand: cardDefaults?.defaultCardBrand ?? 'unknown',
    };
  }

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
    const currencyCode = this.extractCurrencyCode(transaction);
    const customerId = this.extractCustomerId(transaction);
    const amountCapturable = this.extractAmountCapturable(transaction);
    const transactionType = this.extractTransactionType(transaction);
    const created = this.extractCreatedTimestamp(transaction);

    return {
      id: transaction.id ?? '',
      amount: transaction.amount ?? 0,
      currency: currencyCode.toLowerCase(),
      status: this.mapTransactionStatusToPaymentIntentStatus(
        transaction.status ?? 'in_progress',
      ),
      created: created,
      customer: customerId,
      paymentMethod: paymentMethod,
      description: `ChargeBee ${transactionType} transaction`,
      latestCharge: transaction.id ?? '', // In ChargeBee, transaction is the charge
      clientSecret: undefined, // ChargeBee doesn't have client secret concept
      amountCapturable: amountCapturable,
      captureMethod: 'automatic', // ChargeBee default behavior
    };
  }

  private extractCurrencyCode(transaction: ChargebeeTransaction): string {
    const currencyCode =
      ((transaction as Record<string, unknown>)['currency_code'] as
        | string
        | undefined) ?? transaction.currencyCode;
    return currencyCode ?? 'usd';
  }

  private extractCustomerId(
    transaction: ChargebeeTransaction,
  ): string | undefined {
    return (
      ((transaction as Record<string, unknown>)['customer_id'] as
        | string
        | undefined) ?? transaction.customerId
    );
  }

  private extractAmountCapturable(
    transaction: ChargebeeTransaction,
  ): number | undefined {
    return (transaction as Record<string, unknown>)['amount_capturable'] as
      | number
      | undefined;
  }

  private extractTransactionType(transaction: ChargebeeTransaction): string {
    return (
      ((transaction as Record<string, unknown>)['type'] as
        | string
        | undefined) ?? 'transaction'
    );
  }

  private extractCreatedTimestamp(transaction: ChargebeeTransaction): number {
    if (typeof transaction.date === 'string') {
      return Math.floor(new Date(transaction.date).getTime() / 1000);
    }
    return transaction.date ?? 0;
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
  ): PaymentStatus {
    switch (transactionStatus) {
      case 'in_progress':
        return PaymentStatus.PROCESSING;
      case 'success':
        return PaymentStatus.SUCCEEDED;
      case 'voided':
        return PaymentStatus.CANCELED;
      case 'failure':
        return PaymentStatus.CANCELED;
      case 'timeout':
        return PaymentStatus.CANCELED;
      case 'needs_attention':
        return PaymentStatus.REQUIRES_ACTION;
      case 'late_failure':
        return PaymentStatus.CANCELED;
      default:
        return PaymentStatus.REQUIRES_PAYMENT_METHOD;
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
      expMonth: card.expiryMonth ?? this.cardDefaults.defaultExpiryMonth,
      expYear: card.expiryYear ?? this.cardDefaults.defaultExpiryYear,
      funding: card.funding ?? this.cardDefaults.defaultFundingType,
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
    return this.cardDefaults.defaultCardBrand;
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
