import { TCustomer } from '../../../../types';
import {IAddressDto} from './invoice.type';
import { PaymentGateway } from './payment-source.type';

export interface IChargeBeeCustomer extends TCustomer {
  company?: string | undefined;
  phone?: string | undefined;
  billingAddress?: IAddressDto | undefined;
}


  
export interface ICustomer {
  id: string; // max chars=50
  first_name?: string; // optional, max chars=150
  last_name?: string; // optional, max chars=150
  email?: string; // optional, max chars=70
  phone?: string; // optional, max chars=50
  company?: string; // optional, max chars=250
  vat_number?: string; // optional, max chars=20
  auto_collection: 'on' | 'off'; // enumerated string, default=on
  offline_payment_method?: 'no_preference' | 'cash' | 'check' | 'bank_transfer' | 'ach_credit'|'sepa_credit'|'boleto'|'us_automated_bank_transfer'|'eu_automated_bank_transfer'|'uk_automated_bank_transfer'|'jp_automated_bank_transfer'|'mx_automated_bank_transfer'|'custom'; // optional, enumerated string
  net_term_days: number; // integer, default=0
  vat_number_validated_time?: number; // optional, timestamp(UTC) in seconds
  vat_number_status?: 'valid' | 'invalid' | 'not_validated' | 'undetermined'; // optional, enumerated string
  allow_direct_debit: boolean; // default=false
  is_location_valid?: boolean; // optional, boolean
  created_at: number; // timestamp(UTC) in seconds
  created_from_ip?: string; // optional, max chars=50
  exemption_details?: any[]; // optional, jsonarray
  taxability?: 'taxable' | 'exempt'; // optional, enumerated string, default=taxable
  entity_code?: 'a' | 'b' | 'c' | 'd' |'e'|'f'|'g'|'h'|'i'|'j'|'k'|'l'|'m'|'n'|'p'|'q'|'r'|'med1'|'med2'; // optional, enumerated string
  exempt_number?: string; // optional, max chars=100
  resource_version?: number; // optional, long
  updated_at?: number; // optional, timestamp(UTC) in seconds
  locale?: string; // optional, max chars=50
  billing_date?: number; // optional, integer, min=1, max=31
  billing_month?: number; // optional, integer, min=1, max=12
  billing_date_mode?: 'using_defaults' | 'manually_set'; // optional, enumerated string
  billing_day_of_week?: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'; // optional, enumerated string
  billing_day_of_week_mode?: 'using_defaults' | 'manually_set'; // optional, enumerated string
  pii_cleared?: 'active' | 'scheduled_for_clear' | 'cleared'; // optional, enumerated string, default=active
  auto_close_invoices?: boolean; // optional, boolean
  channel?: 'web' | 'app_store' | 'play_store'; // optional, enumerated string
  active_id?: string; // optional, max chars=50
  fraud_flag?: 'safe' | 'suspicious' | 'fraudulent'; // optional, enumerated string
  primary_payment_source_id?: string; // optional, max chars=40
  backup_payment_source_id?: string; // optional, max chars=40
  invoice_notes?: string; // optional, max chars=2000
  business_entity_id?: string; // optional, max chars=50
  preferred_currency_code?: string; // optional, max chars=3
  promotional_credits: number; // in cents, min=0
  unbilled_charges: number; // in cents, min=0
  refundable_credits: number; // in cents, min=0
  excess_payments: number; // in cents, min=0
  is_einvoice_enabled?: boolean; // optional, boolean
  einvoicing_method?: 'automatic' | 'manual' | 'site_default'; // optional, enumerated string
  deleted: boolean; // boolean
  registered_for_gst?: boolean; // optional, boolean
  consolidated_invoicing?: boolean; // optional, boolean
  customer_type?: 'residential' | 'business' | 'senior_citizen' | 'industrial'; // optional, enumerated string
  business_customer_without_vat_number?: boolean; // optional, boolean
  client_profile_id?: string; // optional, max chars=50
  use_default_hierarchy_settings?: boolean; // optional, default=true
  vat_number_prefix?: string; // optional, max chars=10
  entity_identifier_scheme?: string; // optional, max chars=50
  entity_identifier_standard?: string; // optional, default=iso6523-actorid-upis, max chars=50
  billing_address?: BillingAddress; // optional, billing_address
  referral_urls?: ReferralUrl[]; // optional, list of referral_url
  contacts?: Contact[]; // optional, list of contact
  payment_method?: PaymentMethod; // optional, payment_method
  balances?: CustomerBalance[]; // optional, list of customer_balance
  entity_identifiers?: EntityIdentifier[]; // optional, list of entity_identifier
  tax_providers_fields?: TaxProvidersField[]; // optional, list of tax_providers_field
  relationship?: Relationship; // optional, relationship
  parent_account_access?: ParentAccountAccess; // optional, parent_account_access
  child_account_access?: ChildAccountAccess; // optional, child_account_access
}

// Define other related interfaces here
export interface BillingAddress {
  first_name?: string; // optional, max chars=150
  last_name?: string; // optional, max chars=150
  email?: string; // optional, max chars=70
  company?: string; // optional, max chars=250
  phone?: string; // optional, max chars=50
  line1?: string; // optional, max chars=150
  line2?: string; // optional, max chars=150
  line3?: string; // optional, max chars=150
  city?: string; // optional, max chars=50
  state_code?: string; // optional, max chars=50
  state?: string; // optional, max chars=50
  country?: string; // optional, max chars=50
  zip?: string; // optional, max chars=20
  validation_status?: 'not_validated' | 'valid' | 'partially_valid' | 'invalid'; // optional, default=not_validated
}

export interface ReferralUrl {
  external_customer_id?: string; // optional, max chars=100
  referral_sharing_url: string; // max chars=50
  created_at: number; // timestamp(UTC) in seconds
  updated_at: number; // timestamp(UTC) in seconds
  referral_campaign_id: string; // max chars=50
  referral_account_id: string; // max chars=50
  referral_external_campaign_id?: string; // optional, max chars=50
  referral_system: 'referral_candy' | 'referral_saasquatch' | 'friendbuy'; // enumerated string
}

export interface Contact {
  id: string; // max chars=150
  first_name?: string; // optional, max chars=150
  last_name?: string; // optional, max chars=150
  email: string; // max chars=70
  phone?: string; // optional, max chars=50
  label?: string; // optional, max chars=50
  enabled: boolean; // default=false
  send_account_email: boolean; // default=false
  send_billing_email: boolean; // default=false
}

export type PaymentMethodType =
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



export type PaymentMethodStatus =
  | 'valid'
  | 'expiring'
  | 'expired'
  | 'invalid'
  | 'pending_verification';

export interface PaymentMethod {
  type: PaymentMethodType;
  gateway: PaymentGateway;
  gateway_account_id?: string; // optional, max chars=50
  status: PaymentMethodStatus; // default=valid
  reference_id: string; // max chars=200
}

export interface CustomerBalance {
  promotional_credits: number; // in cents, default=0, min=0
  excess_payments: number; // in cents, default=0, min=0
  refundable_credits: number; // in cents, default=0, min=0
  unbilled_charges: number; // in cents, default=0, min=0
  currency_code: string; // max chars=3
}

export interface EntityIdentifier {
  id: string; // max chars=40
  value?: string; // optional, max chars=50
  scheme: string; // max chars=50
  standard?: string; // optional, default=iso6523-actorid-upis, max chars=50
}

export interface TaxProvidersField {
  provider_name: string; // max chars=50
  field_id: string; // max chars=50
  field_value: string; // max chars=50
}
export interface Relationship {
  parent_id?: string; // optional, max chars=50
  payment_owner_id: string; // max chars=50
  invoice_owner_id: string; // max chars=50
}
export interface ParentAccountAccess {
  portal_edit_child_subscriptions?: 'yes' | 'view_only' | 'no'; // optional
  portal_download_child_invoices?: 'yes' | 'view_only' | 'no'; // optional
  send_subscription_emails: boolean;
  send_invoice_emails: boolean;
  send_payment_emails: boolean;
}

export interface ChildAccountAccess {
  portal_edit_subscriptions?: 'yes' | 'view_only'; // optional
  portal_download_invoices?: 'yes' | 'view_only' | 'no'; // optional
  send_subscription_emails: boolean;
  send_invoice_emails: boolean;
  send_payment_emails: boolean;
}

