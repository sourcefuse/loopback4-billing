import {Filter} from '@loopback/repository';
import {AnyObject} from '@loopback/repository';
import { ICardDto, ICharge } from './providers';

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

// export interface Transaction {
//   amount?: number; // Optional, in cents, min=0
//   payment_method: 'cash' | 'check' | 'bank_transfer' | 'other' | 'custom' | 'payment_source'; // Required
//   payment_source_id?:string;
//   reference_number?: string; // Optional, max 100 chars
//   custom_payment_method_id?: string; // Optional, max 50 chars
//   id_at_gateway?: string; // Optional, max 100 chars
//   status?: 'success' | 'failure'; // Optional
//   date?: number; // Optional, timestamp in seconds (UTC)
//   error_code?: string; // Optional, max 100 chars
//   error_text?: string; // Optional, max 65k chars
// }

export interface Transaction {
  amount?: number; // Optional, in cents, min=0
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'other' | 'custom' | 'payment_source'; // Required
  paymentSourceId?: string;
  referenceNumber?: string; // Optional, max 100 chars
  customPaymentMethodId?: string; // Optional, max 50 chars
  idAtGateway?: string; // Optional, max 100 chars
  status?: 'success' | 'failure'; // Optional
  date?: number; // Optional, timestamp in seconds (UTC)
  errorCode?: string; // Optional, max 100 chars
  errorText?: string; // Optional, max 65k chars
  comment?:string;
}


export interface TCustomer{
  id?:string;
  firstName:string;
  lastName:string;
  email:string;
  company?:string;
  billingAddress?:TAddress;
  phone?:string;
  options?:Options;
}

export interface TAddress {
  id?:string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  email?: string | undefined;
  company?: string | undefined;
  phone?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  zip?: string | undefined;
  country?: string | undefined;
  options?:Options;
}


export type Options = AnyObject;

export interface TPaymentSource {
  id?:string;
  customerId: string;
  card?:ICardDto;
  options?:Options;
}

export interface TInvoice {
  id?: string;
  customerId: string;
  shippingAddress?: TAddress;
  status?:InvoiceStatus;
  charges?:ICharge[];
  options?:Options;
}

export type InvoiceStatus =
  | 'paid'
  | 'posted'
  | 'payment_due'
  | 'not_paid'
  | 'voided'
  | 'pending';

export const enum ServiceType {
  SDK,
  REST,
}

export const enum BillingError {
  ProviderNotFound = 'ProviderNotFound',
}
