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
   * Other Chargebee values: `'per_unit'`, `'tiered'`, `'volume'`, `'stairstep'`.
   */
  defaultPricingModel?: string;

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
}
