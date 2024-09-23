import { TPaymentSource } from '../../../../types';
import {IBillingAddress} from './invoice.type';

export interface ICardDto {
  gatewayAccountId: string;
  number: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
}



// payment attributes interface used to pass in chargebee functions
export interface IChargeBeePaymentSource extends TPaymentSource{
  customerId: string;
  card: ICardDto;
}

// Define the enumerations for type, status, and gateway
export type PaymentSourceType =
  | 'card'
  | 'paypal_express_checkout'
  | 'amazon_payments'
  | 'direct_debit'
  | 'generic'
  | 'alipay'
  | 'unionpay'
  | 'apple_pay'
  | 'wechat_pay'
  | 'ideal'
  | 'google_pay'
  | 'sofort'
  | 'bancontact'
  | 'giropay'
  | 'dotpay'
  | 'upi'
  | 'netbanking_emandates'
  | 'venmo'
  | 'pay_to'
  | 'faster_payments'
  | 'sepa_instant_transfer'
  | 'automated_bank_transfer'
  | 'klarna_pay_now'
  | 'online_banking_poland';

export type PaymentSourceStatus =
  | 'valid'
  | 'expiring'
  | 'expired'
  | 'invalid'
  | 'pending_verification';

export type PaymentGateway =
  | 'chargebee'
  | 'chargebee_payments'
  | 'stripe'
  | 'wepay'
  | 'braintree'
  | 'authorize_net'
  | 'paypal_pro'
  | 'pin'
  | 'eway'
  | 'eway_rapid'
  | 'worldpay'
  | 'balanced_payments'
  | 'beanstream'
  | 'bluepay'
  | 'elavon'
  | 'first_data_global'
  | 'hdfc'
  | 'migs'
  | 'nmi'
  | 'ogone'
  | 'paymill'
  | 'paypal_payflow_pro'
  | 'sage_pay'
  | 'tco'
  | 'wirecard'
  | 'amazon_payments'
  | 'paypal_express_checkout'
  | 'gocardless'
  | 'adyen'
  | 'orbital'
  | 'moneris_us'
  | 'moneris'
  | 'bluesnap'
  | 'cybersource'
  | 'vantiv'
  | 'checkout_com'
  | 'paypal'
  | 'ingenico_direct'
  | 'exact'
  | 'mollie'
  | 'quickbooks'
  | 'razorpay'
  | 'global_payments'
  | 'bank_of_america'
  | 'ecentric'
  | 'metrics_global'
  | 'windcave'
  | 'pay_com'
  | 'ebanx'
  | 'dlocal'
  | 'nuvei'
  | 'not_applicable';

// Define the enumerations for brand and funding_type
export type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'american_express'
  | 'discover'
  | 'jcb'
  | 'diners_club'
  | 'other'
  | 'bancontact'
  | 'cmr_falabella'
  | 'tarjeta_naranja'
  | 'nativa'
  | 'cencosud'
  | 'cabal'
  | 'argencard'
  | 'elo'
  | 'hipercard'
  | 'carnet'
  | 'rupay'
  | 'maestro'
  | 'not_applicable';
export type CardFundingType =
  | 'credit'
  | 'debit'
  | 'prepaid'
  | 'not_known'
  | 'not_applicable';

// Define the Card interface
export interface PaymentCard {
  first_name?: string; // Optional, max chars=50
  last_name?: string; // Optional, max chars=50
  iin: string; // Issuer Identification Number, min chars=6, max chars=6
  last4: string; // Last four digits of the card number, min chars=4, max chars=4
  brand: CardBrand; // Card brand
  funding_type: CardFundingType; // Card Funding type
  expiry_month: number; // Card expiry month, min=1, max=12
  expiry_year: number; // Card expiry year
  billing_addr1?: string; // Optional, max chars=150
  billing_addr2?: string; // Optional, max chars=150
  billing_city?: string; // Optional, max chars=50
  billing_state_code?: string; // Optional, max chars=50
  billing_state?: string; // Optional, max chars=50
  billing_country?: string; // Optional, max chars=50, ISO 3166 alpha-2 country code
  billing_zip?: string; // Optional, max chars=20
  masked_number?: string; // Optional, max chars=19
}

export type DirectDebitScheme =
  | 'ach'
  | 'bacs'
  | 'sepa_core'
  | 'autogiro'
  | 'becs'
  | 'becs_nz'
  | 'pad'
  | 'not_applicable';
export type AccountType =
  | 'checking'
  | 'savings'
  | 'business_checking'
  | 'current';
export type ECheckType = 'web' | 'ppd' | 'ccd';
export type AccountHolderType = 'individual' | 'company';

export interface BankAccount {
  last4: string; // min chars=4, max chars=4
  name_on_account?: string; // optional, max chars=300
  first_name?: string; // optional, max chars=150
  last_name?: string; // optional, max chars=150
  direct_debit_scheme?: DirectDebitScheme;
  bank_name?: string; // optional, max chars=100
  mandate_id?: string; // optional, min chars=1, max chars=50
  account_type?: AccountType;
  echeck_type?: ECheckType;
  account_holder_type?: AccountHolderType;
  email?: string; // optional, max chars=70
}

export interface CustVoucherSource {
  last4: string; // min chars=4, max chars=4
  first_name?: string; // optional, max chars=150
  last_name?: string; // optional, max chars=150
  email?: string; // optional, max chars=70
}

export interface AmazonPayment {
  email?: string; // optional, max chars=70
  agreement_id?: string; // optional, max chars=50
}

export interface UPI {
  vpa?: string; // optional, max chars=50
}

export interface PayPal {
  email?: string; // optional, max chars=70
  agreement_id?: string; // optional, max chars=50
}
export interface Venmo {
  user_name?: string; // optional, max chars=50
}

export interface KlarnaPayNow {
  email?: string; // optional, max chars=50
}

export interface Mandate {
  id: string; // max chars=250
  subscription_id: string; // max chars=50
  created_at: number; // timestamp(UTC) in seconds
}

// Define the PaymentSource interface returned by chargebee
export interface IPaymentSource {
  id: string; // Identifier of the payment source, max chars=40
  resource_version?: number; // Optional, version number of this resource
  updated_at?: number; // Optional, timestamp (UTC) in seconds
  created_at: number; // Timestamp (UTC) in seconds
  customer_id: string; // Identifier of the customer, max chars=50
  type: PaymentSourceType; // Type of payment source
  reference_id: string; // Reference id, max chars=200
  status: PaymentSourceStatus; // Status of the payment source, default=valid
  gateway: PaymentGateway; // Name of the gateway
  gateway_account_id?: string; // Optional, max chars=50
  ip_address?: string; // Optional, max chars=50
  issuing_country?: string; // Optional, max chars=50
  deleted: boolean; // Indicates if this resource has been deleted
  business_entity_id?: string; // Optional, max chars=50
  card?: PaymentCard; // Optional, card details
  bank_account?: BankAccount; // Optional, bank account details
  // cust_voucher_source?: CustVoucherSource; // Optional, cust_voucher_source details
  boleto?: CustVoucherSource; // Optional, cust_voucher_source details
  billing_address?: IBillingAddress; // Optional, billing address
  amazon_payment?: AmazonPayment; // Optional, amazon payment details
  upi?: UPI; // Optional, upi details
  paypal?: PayPal; // Optional, paypal details
  venmo?: Venmo; // Optional, venmo details
  klarna_pay_now?: KlarnaPayNow; // Optional, klarna pay now details
  mandates?: Mandate[]; // Optional, list of mandates
}
