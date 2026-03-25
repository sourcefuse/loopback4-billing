import {AnyObject} from '@loopback/repository';
import {ICardDto, ICharge} from './providers';

/**
 * Interface defining the component's options object
 */
export interface BillingComponentOptions {
  // Add the definitions here
}

/**
 * Default options for the component
 */
export const DEFAULT_BILLING_OPTIONS: BillingComponentOptions = {
  // Specify the values here
};

//NTC Billing
export interface IService {
  createCustomer(customerDto: TCustomer): Promise<TCustomer>;
  getCustomers(customerId: string): Promise<TCustomer>;
  updateCustomerById(
    customerId: string,
    customerDto: Partial<TCustomer>,
  ): Promise<void>;
  deleteCustomer(customerId: string): Promise<void>;
  createPaymentSource(paymentDto: TPaymentSource): Promise<TPaymentSource>;
  applyPaymentSourceForInvoice(
    invoiceId: string,
    transaction: Transaction,
  ): Promise<TInvoice>;
  retrievePaymentSource(paymentSourceId: string): Promise<TPaymentSource>;
  deletePaymentSource(paymentSourceId: string): Promise<void>;
  createInvoice(invoice: TInvoice): Promise<TInvoice>;
  retrieveInvoice(invoiceId: string): Promise<TInvoice>;
  updateInvoice(
    invoiceId: string,
    invoice: Partial<TInvoice>,
  ): Promise<TInvoice>;
  deleteInvoice(invoiceId: string): Promise<void>;
  getPaymentStatus(invoiceId: string): Promise<boolean>;
}
export interface IAdapter<T, R = T> {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  adaptToModel(resp: any): T; // NOSONAR
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  adaptFromModel(data: Partial<R>): any; // NOSONAR
}

export interface Transaction {
  amount?: number; // Optional, in cents, min=0
  paymentMethod:
    | 'cash'
    | 'check'
    | 'bank_transfer'
    | 'other'
    | 'custom'
    | 'payment_source'; // Required
  paymentSourceId?: string;
  referenceNumber?: string; // Optional, max 100 chars
  customPaymentMethodId?: string; // Optional, max 50 chars
  idAtGateway?: string; // Optional, max 100 chars
  status?: 'success' | 'failure'; // Optional
  date?: number; // Optional, timestamp in seconds (UTC)
  errorCode?: string; // Optional, max 100 chars
  errorText?: string; // Optional, max 65k chars
  comment?: string;
}

export interface TCustomer {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  billingAddress?: TAddress;
  phone?: string;
  options?: Options;
}

export interface TAddress {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  phone?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  options?: Options;
}

export type Options = AnyObject;

export interface TPaymentSource {
  id?: string;
  customerId: string;
  card?: ICardDto;
  options?: Options;
}

export interface TInvoice {
  id?: string;
  customerId: string;
  shippingAddress?: TAddress;
  status?: InvoiceStatus;
  charges?: ICharge[];
  options?: Options;
  currencyCode: string;
}

export type InvoiceStatus =
  | 'paid'
  | 'posted'
  | 'payment_due'
  | 'not_paid'
  | 'voided'
  | 'pending';

// ---------------------------------------------------------------------------
// Subscription Management Types
// ---------------------------------------------------------------------------

/**
 * Supported billing collection methods for recurring subscriptions.
 */
export enum CollectionMethod {
  CHARGE_AUTOMATICALLY = 'charge_automatically',
  SEND_INVOICE = 'send_invoice',
}

/**
 * Supported recurring billing intervals.
 */
export enum RecurringInterval {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

/**
 * Controls how prorations are calculated when a subscription is updated.
 */
export enum ProrationBehavior {
  CREATE_PRORATIONS = 'create_prorations',
  NONE = 'none',
  ALWAYS_INVOICE = 'always_invoice',
}

/**
 * Parameters required to create a product in the billing provider.
 */
export interface TProduct {
  name: string;
  description?: string;
  metadata?: Record<string, string>;
}

/**
 * Provider-agnostic representation of a recurring price / plan.
 */
export interface TPrice {
  id?: string;
  currency: string;
  unitAmount: number;
  /** External product ID that this price belongs to. */
  product: string;
  recurring?: {
    interval: RecurringInterval;
    intervalCount: number;
  };
  metadata?: Record<string, string>;
  active?: boolean;
}

/**
 * Parameters required to create a new subscription.
 */
export interface TSubscriptionCreate {
  customerId: string;
  /** Price / plan reference ID from the billing provider. */
  priceRefId: string;
  collectionMethod: CollectionMethod;
  /** Number of days after which the invoice is due (applicable for send_invoice). */
  daysUntilDue?: number;
}

/**
 * Parameters allowed when upgrading or downgrading an existing subscription.
 */
export interface TSubscriptionUpdate {
  /** New price / plan reference ID. */
  priceRefId?: string;
  prorationBehavior?: ProrationBehavior;
}

/**
 * Provider-agnostic subscription result returned after create / update / get.
 */
export interface TSubscriptionResult {
  id: string;
  status: string;
  customerId: string;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
}

/**
 * Detailed price breakdown of an invoice.
 */
export interface TInvoicePrice {
  currency: string;
  totalAmount: number;
  taxAmount: number;
  amountExcludingTax: number;
}

/**
 * Interface that any billing provider must implement to support the full
 * recurring-subscription lifecycle.
 *
 * Keeps subscription concerns separated from one-time billing (IService),
 * following the Interface Segregation Principle.
 */
export interface ISubscriptionService {
  /**
   * Creates a product in the billing provider and returns its external ID.
   */
  createProduct(product: TProduct): Promise<string>;

  /**
   * Creates a price (recurring billing configuration) and returns the full price object.
   */
  createPrice(price: TPrice): Promise<TPrice>;

  /**
   * Creates a new recurring subscription and returns its external ID.
   */
  createSubscription(subscription: TSubscriptionCreate): Promise<string>;

  /**
   * Retrieves the current state of a subscription by its external ID.
   */
  getSubscription(subscriptionId: string): Promise<TSubscriptionResult>;

  /**
   * Upgrades or downgrades an active subscription.
   * Handles the incomplete-subscription edge case automatically.
   */
  updateSubscription(
    subscriptionId: string,
    updates: TSubscriptionUpdate,
  ): Promise<TSubscriptionResult>;

  /**
   * Cancels a subscription immediately with proration and voids open invoices.
   */
  cancelSubscription(subscriptionId: string): Promise<void>;

  /**
   * Pauses a subscription (marks outstanding invoices as uncollectible).
   */
  pauseSubscription(subscriptionId: string): Promise<void>;

  /**
   * Resumes a previously paused subscription.
   */
  resumeSubscription(subscriptionId: string): Promise<void>;

  /**
   * Returns a detailed price breakdown (total, tax, amount excluding tax) for an invoice.
   */
  getInvoicePriceDetails(invoiceId: string): Promise<TInvoicePrice>;

  /**
   * Sends the hosted payment link for a given invoice to the customer.
   */
  sendPaymentLink(invoiceId: string): Promise<void>;

  /**
   * Checks whether a product exists and is still active in the billing provider.
   */
  checkProductExists(productId: string): Promise<boolean>;
}

export const enum ServiceType {
  SDK,
  REST,
}

export const enum BillingError {
  ProviderNotFound = 'ProviderNotFound',
}
