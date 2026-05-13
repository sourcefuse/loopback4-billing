/**
 * Card default values for when card data is missing from the provider response.
 * These should only be used as fallbacks when payment providers return incomplete data.
 */
export interface ChargebeeCardDefaults {
  /** Default expiry month (1-12). Defaults to 12. */
  defaultExpiryMonth?: number;
  /** Default expiry year. Defaults to current year. */
  defaultExpiryYear?: number;
  /** Default funding type. Defaults to 'credit'. */
  defaultFundingType?: string;
  /** Default card brand. Defaults to 'unknown'. */
  defaultCardBrand?: string;
}

/**
 * Configuration for the Chargebee billing provider.
 *
 * All fields beyond `site` and `apiKey` are optional overrides — sensible
 * defaults are applied when omitted so existing integrations require no changes.
 */
export interface ChargeBeeConfig {
  site: string;
  apiKey: string;

  /**
   * The Chargebee Item Family ID that new Items (Products) are created under.
   * Defaults to `'default'` which works for single-family Chargebee sites.
   * Override for multi-family setups.
   */
  defaultItemFamilyId?: string;

  /**
   * Pricing model applied when creating ItemPrices.
   * Defaults to `'flat_fee'` (single fixed recurring charge).
   */
  defaultPricingModel?: ChargebeePricingModel;

  /**
   * When `true`, subscriptions are cancelled at the end of the current billing
   * period (grace-period cancellation). When `false` (default), the
   * cancellation is immediate with a prorated credit note applied.
   */
  cancelAtEndOfTerm?: boolean;

  /**
   * The cancel reason code sent to Chargebee when a subscription is cancelled.
   * Defaults to `'customer_request'`.
   * Must be one of the reason codes configured on your Chargebee site.
   */
  defaultCancelReasonCode?: string;
  /**
   * Card default values for fallback when provider returns incomplete card data.
   * These should rarely be needed with valid Chargebee responses.
   */
  cardDefaults?: ChargebeeCardDefaults;
}

export type ChargebeePricingModel =
  | 'flat_fee'
  | 'per_unit'
  | 'tiered'
  | 'volume'
  | 'stairstep';

export type ChargebeePeriodUnit = 'day' | 'week' | 'month' | 'year';

/**
 * ChargeBee linked payment object structure (flexible to handle API responses)
 */
export interface ChargebeeLinkedPayment {
  id?: string;
  customerId?: string;
  invoiceId?: string;
  appliedAt?: string;
  amount?: number;
  currencyCode?: string;
  status?: string;
  [key: string]: unknown;
}

/**
 * ChargeBee card object structure (flexible to handle API responses)
 */
export interface ChargebeeCard {
  firstSixDigits?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  funding?: string;
  [key: string]: unknown;
}

/**
 * ChargeBee payment source object structure (flexible to handle API responses)
 */
export interface ChargebeePaymentSource {
  id?: string;
  customerId?: string;
  type?: string;
  card?: ChargebeeCard;
  [key: string]: unknown;
}

/**
 * ChargeBee customer object structure (flexible to handle API responses)
 */
export interface ChargebeeCustomer {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  paymentSource?: ChargebeePaymentSource;
  [key: string]: unknown;
}

/**
 * ChargeBee invoice object structure (flexible to handle API responses)
 */
export interface ChargebeeInvoice {
  invoiceId?: string;
  id?: string;
  customerId?: string;
  total?: number;
  currencyCode?: string;
  status?: string;
  paidAt?: string;
  linkedPayments?: ChargebeeLinkedPayment[];
  [key: string]: unknown;
}

/**
 * ChargeBee transaction object structure (flexible to handle API responses)
 */
export interface ChargebeeTransaction {
  id?: string;
  customerId?: string;
  amount?: number;
  currencyCode?: string;
  status?: string;
  date?: string | number;
  description?: string;
  metadata?: Record<string, string>;
  gatewayAccountId?: string;
  [key: string]: unknown;
}
