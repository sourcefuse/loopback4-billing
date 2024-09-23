import { InvoiceStatus, TInvoice } from "../../../../types";

export type IApplyOn = 'invoice_amount' | 'specific_item_price';
export interface IDiscount {
  apply_on: IApplyOn;
}
export type AutoCollection = 'on' | 'off';


// invoice attributes interface used to pass in chargebee functions
// export interface IInvoiceDto {
//   id?: string;
//   customer_id: string;
//   shipping_address?: IAddressDto;
//   charges?: ICharge[];
//   auto_collection?: AutoCollection;
//   discounts: Array<IDiscount>;
// }


export interface IChargeBeeInvoice extends TInvoice{

  charges?: ICharge[];
  options:{
    discounts?: Array<IDiscount>;
    autoCollection?: AutoCollection;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    [key: string]: any; //NOSONAR
  }
}

export interface IAddressDto {
  firstName?: string | undefined;
  lastName?: string | undefined;
  email?: string | undefined;
  company?: string | undefined;
  phone?: string | undefined;
  line1?: string;
  line2?: string;
  line3?: string;
  city?: string | undefined;
  state?: string | undefined;
  zip?: string | undefined;
  country?: string | undefined;
}

export interface ICharge {
  amount: number;
  description: string;
}

export type DunningStatus = 'in_progress' | 'exhausted' | 'stopped' | 'success';


export type PriceType = 'tax_exclusive' | 'tax_inclusive';

// invoice interface returned by chargebee
export interface IInvoice {
  id: string;
  po_number?: string;
  customer_id: string;
  subscription_id?: string;
  recurring?: boolean;
  status: InvoiceStatus;
  vat_number?: string;
  price_type: PriceType;
  date?: number;
  due_date?: number;
  net_term_days?: number;
  exchange_rate?: number;
  currency_code: string;
  total?: number;
  amount_paid?: number;
  amount_adjusted?: number;
  write_off_amount?: number;
  credits_applied?: number;
  amount_due?: number;
  paid_at?: number;
  dunning_status?: DunningStatus;
  next_retry_at?: number;
  voided_at?: number;
  resource_version?: number;
  updated_at?: number;
  sub_total: number;
  sub_total_in_local_currency?: number;
  total_in_local_currency?: number;
  local_currency_code?: string;
  tax: number;
  local_currency_exchange_rate?: number;
  first_invoice?: boolean;
  new_sales_amount?: number;
  has_advance_charges?: boolean;
  term_finalized?: boolean;
  is_gifted?: boolean;
  generated_at?: number;
  expected_payment_date?: number;
  amount_to_collect?: number;
  round_off_amount?: number;
  payment_owner?: string;
  void_reason_code?: string;
  deleted: boolean;
  tax_category?: string;
  vat_number_prefix?: string;
  channel?: Channel;
  business_entity_id?: string;
  line_items?: LineItem[];
  discounts?: Discount[];
  line_item_discounts?: LineItemDiscount[];
  taxes?: Tax[];
  line_item_taxes?: LineItemTax[];
  line_item_tiers?: LineItemTier[];
  linked_payments?: LinkedPayment[];
  dunning_attempts?: DunningAttempt[];
  applied_credits?: AppliedCredit[];
  adjustment_credit_notes?: ICreatedCreditNote[];
  issued_credit_notes?: ICreatedCreditNote[];
  linked_orders?: ILinkedOrder[];
  notes?: INote[];
  shipping_address?: IShippingAddress;
  statement_descriptor?: IStatementDescriptor;
  billing_address?: IBillingAddress;
  einvoice?: IEInvoice;
  linked_taxes_withheld?: ILinkedTaxWithheld[];
  site_details_at_creation?: ISiteDetailsAtCreation;
  tax_origin?: ITaxOrigin;
}
export type Channel = 'web' | 'app_store' | 'play_store';
export interface LineItem {
  id?: string; // Optional, uniquely identifies a line item
  subscription_id?: string; // Optional, unique identifier for the subscription this line item belongs to
  date_from: number; // Start date of this line item (timestamp in UTC seconds)
  date_to: number; // End date of this line item (timestamp in UTC seconds)
  unit_amount: number; // Unit amount of the line item (in cents)
  quantity?: number; // Optional, quantity of the recurring item, default is 1
  amount?: number; // Optional, total amount of this line item (in cents), typically equals unit amount x quantity
  pricing_model?: 'flat_fee' | 'per_unit' | 'tiered' | 'volume' | 'stairstep'; // Optional, pricing scheme for this item price
  is_taxed?: boolean; // Optional, specifies whether this line item is taxed or not (default is false)
  tax_amount?: number; // Optional, tax amount charged for this item (in cents), default is 0
  tax_rate?: number; // Optional, rate of tax used to calculate tax for this line item (min 0.0, max 100.0)
  unit_amount_in_decimal?: string; // Optional, decimal representation of the unit amount of the line item
  quantity_in_decimal?: string; // Optional, decimal representation of the quantity of this line item
  amount_in_decimal?: string; // Optional, decimal representation of the amount for the line item
  discount_amount?: number; // Optional, total discounts for this line (in cents)
  item_level_discount_amount?: number; // Optional, line item-level discounts for this line (in cents)
  reference_line_item_id?: string; // Optional, unique identifier of the invoice line item related to this credit note line item
  description: string; // Detailed description about this line item
  entity_description?: string; // Optional, detailed description about this item
  entity_type?:
    | 'adhoc'
    | 'plan_item_price'
    | 'addon_item_price'
    | 'charge_item_price'; // Optional, modelled entity this line item is based on
  tax_exempt_reason?:
    | 'tax_not_configured'
    | 'region_non_taxable'
    | 'export'
    | 'customer_exempt'
    | 'high_value_physical_goods'
    | 'reverse_charge'
    | 'zero_rated'
    | 'tax_not_configured_external_provider'
    | 'zero_value_item'
    | 'product_exempt'; // Optional, reason for tax exemption
  entity_id?: string; // Optional, identifier of the modelled entity this line item is based on (null for 'adhoc')
  customer_id?: string; // Optional, unique identifier for the customer this line item belongs to
}

export interface Discount {
  amount: number; // The amount deducted in cents
  description?: string; // Optional description for this deduction
  line_item_id?: string; // Optional, unique id of the line item that this deduction is for
  entity_type?:
    | 'item_level_coupon'
    | 'document_level_coupon'
    | 'promotional_credits'
    | 'prorated_credits'
    | 'item_level_discount'
    | 'document_level_discount'; // Optional type of deduction
  discount_type?: 'fixed_amount' | 'percentage'; // Optional, type of discount, relevant only when entity_type is one of the item or document level types
  entity_id?: string; // Optional id of the coupon or discount
  coupon_set_code?: string; // Optional coupon code used to provide the discount
}

export interface LineItemDiscount {
  line_item_id: string; // The unique id of the line item that this deduction is for
  discount_type:
    | 'item_level_coupon'
    | 'document_level_coupon'
    | 'promotional_credits'
    | 'prorated_credits'
    | 'item_level_discount'
    | 'document_level_discount'; // Type of deduction
  entity_id?: string; // Optional id of the coupon or discount, if applicable
  discount_amount: number; // The amount deducted in cents
}

export interface Tax {
  name: string; // The name of the tax applied, e.g., GST
  amount: number; // The tax amount in cents
  description?: string; // Optional description of the tax item
}

export interface LineItemTax {
  line_item_id?: string;
  tax_name: string;
  tax_rate: number;
  date_to?: number;
  date_from?: number;
  prorated_taxable_amount?: number; // Use string for bigdecimal representation
  is_partial_tax_applied?: boolean;
  is_non_compliance_tax?: boolean;
  taxable_amount: number;
  tax_amount: number;
  tax_juris_type?:
    | 'country'
    | 'federal'
    | 'state'
    | 'county'
    | 'city'
    | 'special'
    | 'unincorporated'
    | 'other';
  tax_juris_name?: string;
  tax_juris_code?: string;
  tax_amount_in_local_currency?: number;
  local_currency_code?: string;
}

export interface LineItemTier {
  line_item_id?: string;
  starting_unit: number;
  ending_unit?: number;
  quantity_used: number;
  unit_amount: number;
  starting_unit_in_decimal?: string;
  ending_unit_in_decimal?: string;
  quantity_used_in_decimal?: string;
  unit_amount_in_decimal?: string;
}

export interface LinkedPayment {
  txn_id: string;
  applied_amount: number;
  applied_at: number;
  txn_status?: TransactionStatus;
  txn_date?: number;
  txn_amount?: number;
}

export interface DunningAttempt {
  attempt: number;
  transaction_id?: string;
  dunning_type?: DunningType;
  created_at?: number;
  txn_status?: TransactionStatus;
  txn_amount?: number;
}

export type DunningType = 'auto_collect' | 'offline' | 'direct_debit';
export type TransactionStatus =
  | 'in_progress'
  | 'success'
  | 'voided'
  | 'failure'
  | 'timeout'
  | 'needs_attention';

export interface ILinkedOrder {
  id: string;
  document_number?: string;
  status?: LinkedOrderStatus;
  order_type?: OrderType;
  reference_id?: string;
  fulfillment_status?: string;
  batch_id?: string;
  created_at: number;
}
export interface ICreatedCreditNote {
  cn_id: string;
  cn_reason_code?: CreditNoteReasonCode;
  cn_create_reason_code?: string;
  cn_date?: number;
  cn_total?: number;
  cn_status: CreditNoteStatus;
}
export interface AppliedCredit {
  cn_id: string;
  applied_amount: number;
  applied_at: number;
  cn_reason_code?: CreditNoteReasonCode;
  cn_create_reason_code?: string;
  cn_date?: number;
  cn_status: CreditNoteStatus;
}

export type CreditNoteReasonCode =
  | 'write_off'
  | 'subscription_change'
  | 'subscription_cancellation'
  | 'subscription_pause'
  | 'chargeback'
  | 'product_unsatisfactory'
  | 'service_unsatisfactory'
  | 'order_change'
  | 'order_cancellation'
  | 'waiver'
  | 'other'
  | 'fraudulent';
export type CreditNoteStatus =
  | 'adjusted'
  | 'refunded'
  | 'refund_due'
  | 'voided';

export type LinkedOrderStatus =
  | 'voided'
  | 'new'
  | 'processing'
  | 'complete'
  | 'cancelled'
  | 'partially_delivered'
  | 'queued'
  | 'delivered'
  | 'on_hold'
  | 'shipped'
  | 'awaiting_shipment'
  | 'returned';
export type OrderType = 'manual' | 'system_generated';

export interface INote {
  entity_type: EntityType;
  note: string;
  entity_id?: string;
}

export type EntityType =
  | 'coupon'
  | 'subscription'
  | 'customer'
  | 'plan_item_price'
  | 'addon_item_price'
  | 'charge_item_price'
  | 'tax';

export interface IStatementDescriptor {
  id: string;
  descriptor?: string;
}
export interface ISiteDetailsAtCreation {
  timezone?: string;
  organization_address?: object;
}
export interface ILinkedTaxWithheld {
  id: string; // An auto-generated unique identifier for the tax withheld
  amount?: number; // The amount withheld by the customer as tax from the invoice
  description?: string; // The description for this tax withheld
  date?: number; // Date or time associated with the tax withheld
  reference_number?: string; // A unique external reference number for the tax withheld
}

export interface IEInvoice {
  id: string; // The unique id for the e-invoice. This is auto-generated by Chargebee.
  reference_number?: string; // This attribute is used to populate the unique reference number assigned to an invoice on the Invoice Registration Portal (IRP) network.
  status: EInvoiceStatus; // The status of processing the e-invoice.
  message?: string; // Detailed information about the status of the e-invoice.
}

export type EInvoiceStatus =
  | 'scheduled'
  | 'skipped'
  | 'in_progress'
  | 'success'
  | 'failed'
  | 'registered';

export interface IBillingAddress {
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
  validation_status?: ValidationStatus; // optional, enumerated string, default=not_validated
}
export interface IShippingAddress {
  first_name?: string; // max chars=150
  last_name?: string; // max chars=150
  email?: string; // max chars=70
  company?: string; // max chars=250
  phone?: string; // max chars=50
  line1?: string; // max chars=150
  line2?: string; // max chars=150
  line3?: string; // max chars=150
  city?: string; // max chars=50
  state_code?: string; // max chars=50
  state?: string; // max chars=50
  country?: string; // max chars=50
  zip?: string; // max chars=20
  validation_status?: ValidationStatus; // default=not_validated
  index: number; // min=0
}

export type ValidationStatus =
  | 'not_validated'
  | 'valid'
  | 'partially_valid'
  | 'invalid';

export interface ITaxOrigin {
  country?: string;
  registration_number?: string;
}
