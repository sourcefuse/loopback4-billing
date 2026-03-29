/* eslint-disable @typescript-eslint/naming-convention */
import {randomUUID} from 'crypto';
import {inject} from '@loopback/core';
import chargebee from 'chargebee';
import {
  RecurringInterval,
  TInvoicePrice,
  TPrice,
  TProduct,
  TSubscriptionCreate,
  TSubscriptionResult,
  TSubscriptionUpdate,
  Transaction,
} from '../../../types';
import {
  CustomerAdapter,
  InvoiceAdapter,
  PaymentSourceAdapter,
  ChargebeeSubscriptionAdapter,
} from './adapter';
import {ChargeBeeBindings} from './key';
import {
  ChargeBeeConfig,
  IChargeBeeCustomer,
  IChargeBeeInvoice,
  IChargeBeePaymentSource,
  IChargeBeeService,
} from './type';

export class ChargeBeeService implements IChargeBeeService {
  invoiceAdapter: InvoiceAdapter;
  customerAdapter: CustomerAdapter;
  paymentSource: PaymentSourceAdapter;
  chargebeeSubscriptionAdapter: ChargebeeSubscriptionAdapter;
  constructor(
    @inject(ChargeBeeBindings.config, {optional: true})
    private readonly chargeBeeConfig: ChargeBeeConfig,
  ) {
    // Only configure the global chargebee singleton when a valid site is
    // provided. This prevents a second instantiation with empty config
    // (e.g. SDKProvider vs SubscriptionProvider) from resetting the site.
    if (chargeBeeConfig?.site) {
      chargebee.configure({
        site: chargeBeeConfig.site,
        api_key: chargeBeeConfig.apiKey,
      });
    }
    this.invoiceAdapter = new InvoiceAdapter();
    this.customerAdapter = new CustomerAdapter();
    this.paymentSource = new PaymentSourceAdapter();
    this.chargebeeSubscriptionAdapter = new ChargebeeSubscriptionAdapter();
  }
  async createCustomer(
    customerDto: IChargeBeeCustomer,
  ): Promise<IChargeBeeCustomer> {
    try {
      const result = await chargebee.customer
        .create({
          first_name: customerDto.firstName,
          last_name: customerDto.lastName,
          email: customerDto.email,
          company: customerDto.company,
          billing_address: {
            first_name: customerDto.billingAddress?.firstName,
            last_name: customerDto.billingAddress?.lastName,
            email: customerDto.billingAddress?.email,
            company: customerDto.billingAddress?.company,
            phone: customerDto.billingAddress?.phone,
            line1: customerDto.billingAddress?.line1,
            line2: customerDto.billingAddress?.line2,
            line3: customerDto.billingAddress?.line3,
            city: customerDto.billingAddress?.city,
            state: customerDto.billingAddress?.state,
            zip: customerDto.billingAddress?.zip,
            country: customerDto.billingAddress?.country,
          },
          phone: customerDto.phone,
        })
        .request();
      return this.customerAdapter.convert(result.customer);
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  async getCustomers(customerId: string): Promise<IChargeBeeCustomer> {
    try {
      const result = await chargebee.customer.retrieve(customerId).request();
      return this.customerAdapter.convert(result.customer);
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }
  async updateCustomerById(
    customerId: string,
    customerDto: Partial<IChargeBeeCustomer>,
  ): Promise<void> {
    try {
      const billingAddress = {
        first_name: customerDto.billingAddress?.firstName,
        last_name: customerDto.billingAddress?.lastName,
        email: customerDto.billingAddress?.email,
        company: customerDto.billingAddress?.company,
        phone: customerDto.billingAddress?.phone,
        line1: customerDto.billingAddress?.line1,
        line2: customerDto.billingAddress?.line2,
        line3: customerDto.billingAddress?.line3,
        city: customerDto.billingAddress?.city,
        state: customerDto.billingAddress?.state,
        zip: customerDto.billingAddress?.zip,
        country: customerDto.billingAddress?.country,
      };
      const transformedDto = {
        ...(customerDto.id && {id: customerDto.id}),
        ...(customerDto.firstName && {first_name: customerDto.firstName}),
        ...(customerDto.lastName && {last_name: customerDto.lastName}),
        ...(customerDto.email && {email: customerDto.email}),
        ...(customerDto.company && {company: customerDto.company}),
        ...(customerDto.billingAddress && {billing_address: billingAddress}),
        ...(customerDto.phone && {phone: customerDto.phone}),
        ...(customerDto.options && {options: customerDto.options}),
      };

      await chargebee.customer.update(customerId, transformedDto).request();
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  async deleteCustomer(customerId: string): Promise<void> {
    try {
      await chargebee.customer.delete(customerId).request();
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }
  async createPaymentSource(
    paymentDto: IChargeBeePaymentSource,
  ): Promise<IChargeBeePaymentSource> {
    try {
      const result = await chargebee.payment_source
        .create_card({
          customer_id: paymentDto.customerId,
          card: {
            gateway_account_id: paymentDto.card.gatewayAccountId,
            number: paymentDto.card.number,
            expiry_month: paymentDto.card.expiryMonth,
            expiry_year: paymentDto.card.expiryYear,
            cvv: paymentDto.card.cvv,
          },
        })
        .request();

      return this.paymentSource.convert(result.payment_source);
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }
  async applyPaymentSourceForInvoice(
    invoiceId: string,
    transaction: Transaction,
  ): Promise<IChargeBeeInvoice> {
    try {
      if (transaction.paymentMethod !== 'payment_source') {
        const result = await chargebee.invoice
          .record_payment(invoiceId, {
            comment: transaction.comment,
            transaction: {
              amount: transaction.amount,
              payment_method: transaction.paymentMethod,
              date: transaction.date,
              status: 'success',
            },
          })
          .request();
        return this.invoiceAdapter.convert(result.invoice);
      } else if (
        transaction.paymentMethod === 'payment_source' &&
        !transaction.paymentMethod
      ) {
        throw new Error(
          'payment source id is not given for payment_method - payment_source',
        );
      } else {
        // Do Nothing
      }

      const result = await chargebee.invoice
        .collect_payment(invoiceId, {
          payment_source_id: transaction.paymentSourceId,
        })
        .request();
      return this.invoiceAdapter.convert(result.invoice);
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }
  async retrievePaymentSource(
    paymentSourceId: string,
  ): Promise<IChargeBeePaymentSource> {
    try {
      const result = await chargebee.payment_source
        .retrieve(paymentSourceId)
        .request();
      return this.paymentSource.convert(result.payment_source);
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }
  async deletePaymentSource(paymentSourceId: string): Promise<void> {
    try {
      await chargebee.payment_source.delete(paymentSourceId).request();
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }
  async createInvoice(invoice: IChargeBeeInvoice): Promise<IChargeBeeInvoice> {
    try {
      const result = await chargebee.invoice
        .create_for_charge_items_and_charges({
          customer_id: invoice.customerId,
          shipping_address: {
            first_name: invoice.shippingAddress?.firstName,
            last_name: invoice.shippingAddress?.lastName,
            email: invoice.shippingAddress?.email,
            company: invoice.shippingAddress?.company,
            phone: invoice.shippingAddress?.phone,
            city: invoice.shippingAddress?.city,
            state: invoice.shippingAddress?.state,
            zip: invoice.shippingAddress?.zip,
            country: invoice.shippingAddress?.country,
          },
          charges: invoice.charges,
          auto_collection: invoice.options.autoCollection,
          discounts:
            invoice.options.discounts?.map(discount => ({
              ...discount,
              apply_on: discount.applyOn, // Convert to snake_case
            })) ?? [],
          currency_code: invoice.currencyCode,
        })
        .request();
      return this.invoiceAdapter.convert(result.invoice);
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }
  async retrieveInvoice(invoiceId: string): Promise<IChargeBeeInvoice> {
    try {
      const result = await chargebee.invoice.retrieve(invoiceId).request();
      return this.invoiceAdapter.convert(result.invoice);
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }
  async updateInvoice(
    invoiceId: string,
    invoice: Partial<IChargeBeeInvoice>,
  ): Promise<IChargeBeeInvoice> {
    try {
      const result = await chargebee.invoice
        .update_details(invoiceId, {
          shipping_address: {
            first_name: invoice.shippingAddress?.firstName,
            last_name: invoice.shippingAddress?.lastName,
            email: invoice.shippingAddress?.email,
            company: invoice.shippingAddress?.company,
            phone: invoice.shippingAddress?.phone,
            city: invoice.shippingAddress?.city,
            state: invoice.shippingAddress?.state,
            zip: invoice.shippingAddress?.zip,
            country: invoice.shippingAddress?.country,
          },
        })
        .request();
      return this.invoiceAdapter.convert(result.invoice);
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }
  async deleteInvoice(invoiceId: string): Promise<void> {
    try {
      await chargebee.invoice.delete(invoiceId).request();
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }
  async getPaymentStatus(invoiceId: string): Promise<boolean> {
    try {
      const result = await chargebee.invoice.retrieve(invoiceId).request();
      return result.invoice.status === 'paid';
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  // ---------------------------------------------------------------------------
  // ISubscriptionService implementation (Chargebee Items API v2)
  // ---------------------------------------------------------------------------

  /**
   * Creates a plan-type Item in Chargebee and returns its Item ID.
   *
   * Chargebee's equivalent of a Stripe Product is an `Item` with `type: plan`.
   *
   * @param product - Product details (name, optional description and metadata).
   * @returns The Chargebee Item ID.
   */
  async createProduct(product: TProduct): Promise<string> {
    try {
      const itemId = product.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Strip item_family_id from metadata — it is a top-level Chargebee param,
      // and Chargebee rejects it if it appears inside metadata.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {item_family_id: _ignored, ...restMetadata} = (product.metadata ??
        {}) as Record<string, unknown>;
      const hasExtraMetadata = Object.keys(restMetadata).length > 0;

      const result = await chargebee.item
        .create({
          id: itemId,
          name: product.name,
          description: product.description,
          type: 'plan',
          item_family_id:
            (product.metadata?.['item_family_id'] as string) ??
            this.chargeBeeConfig.defaultItemFamilyId ??
            'default',
          // Only include metadata key if there are non-family fields to send.
          // Passing metadata: undefined still serialises the key; use spread instead.
          ...(hasExtraMetadata ? {metadata: restMetadata as object} : {}),
        })
        .request();
      return result.item.id;
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  /**
   * Creates an ItemPrice (recurring price configuration) in Chargebee and
   * returns the normalised {@link TPrice}.
   *
   * Chargebee's equivalent of a Stripe Price is an `ItemPrice`.
   *
   * @param price - Price configuration including currency, amount and recurrence.
   * @returns The created price with its Chargebee-assigned ID.
   */
  async createPrice(price: TPrice): Promise<TPrice> {
    try {
      // Chargebee requires an explicit ItemPrice ID or auto-generates one.
      // randomUUID() is cryptographically secure (Node.js built-in v14.17+);
      // the first 8-hex segment keeps the ID short and Chargebee-friendly.
      const priceId =
        price.id ??
        `${price.product}-${price.currency}-${randomUUID().split('-')[0]}`;

      const result = await chargebee.item_price
        .create({
          id: priceId,
          name: priceId, // Chargebee requires a display name
          item_id: price.product,
          currency_code: price.currency.toUpperCase(),
          price: price.unitAmount,
          pricing_model: (this.chargeBeeConfig.defaultPricingModel ??
            'flat_fee') as
            | 'flat_fee'
            | 'per_unit'
            | 'tiered'
            | 'volume'
            | 'stairstep',
          period_unit: price.recurring?.interval as
            | 'day'
            | 'week'
            | 'month'
            | 'year'
            | undefined,
          period: price.recurring?.intervalCount,
          tax_providers_fields: [], // Required by SDK type but can be empty
        })
        .request();

      const ip = result.item_price;
      return {
        id: ip.id,
        currency: ip.currency_code.toLowerCase(),
        unitAmount: ip.price ?? 0,
        product: ip.item_id ?? price.product,
        recurring: ip.period_unit
          ? {
              interval: ip.period_unit as RecurringInterval,
              intervalCount: ip.period ?? 1,
            }
          : undefined,
        active: ip.status === 'active',
      };
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  /**
   * Creates a new recurring subscription in Chargebee using the Items API.
   *
   * Uses `create_with_items` which maps to your `priceRefId` (ItemPrice ID).
   *
   * @param subscription - Subscription parameters.
   * @returns The Chargebee Subscription ID.
   */
  async createSubscription(subscription: TSubscriptionCreate): Promise<string> {
    try {
      const params =
        this.chargebeeSubscriptionAdapter.adaptFromModel(subscription);
      const result = await chargebee.subscription
        .create_with_items(subscription.customerId, params)
        .request();
      return result.subscription.id;
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  /**
   * Retrieves the current state of a subscription from Chargebee.
   *
   * @param subscriptionId - The Chargebee subscription ID.
   * @returns A normalised {@link TSubscriptionResult}.
   */
  async getSubscription(subscriptionId: string): Promise<TSubscriptionResult> {
    try {
      const result = await chargebee.subscription
        .retrieve(subscriptionId)
        .request();
      return this.chargebeeSubscriptionAdapter.adaptToModel(
        result.subscription,
      );
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  /**
   * Upgrades or downgrades an active subscription in Chargebee.
   *
   * Uses `update_for_items` which applies immediate proration by default.
   * Pass `prorationBehavior: 'none'` in `updates` to suppress proration.
   *
   * @param subscriptionId - The Chargebee subscription ID to modify.
   * @param updates - The new ItemPrice ID and optional proration behaviour.
   * @returns A normalised {@link TSubscriptionResult} reflecting the change.
   */
  async updateSubscription(
    subscriptionId: string,
    updates: TSubscriptionUpdate,
  ): Promise<TSubscriptionResult> {
    try {
      const result = await chargebee.subscription
        .update_for_items(subscriptionId, {
          subscription_items: updates.priceRefId
            ? [{item_price_id: updates.priceRefId}]
            : [],
          discounts: [], // Required by Chargebee SDK type
          // When prorationBehavior is 'none', pass prorate:false to suppress credit notes
          prorate: updates.prorationBehavior !== 'none',
        })
        .request();
      return this.chargebeeSubscriptionAdapter.adaptToModel(
        result.subscription,
      );
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  /**
   * Cancels a subscription immediately in Chargebee.
   *
   * Sets `end_of_term: false` for immediate cancellation with proration credit
   * (Chargebee applies a pro-rated credit note automatically).
   *
   * @param subscriptionId - The Chargebee subscription ID to cancel.
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await chargebee.subscription
        .cancel_for_items(subscriptionId, {
          end_of_term: this.chargeBeeConfig.cancelAtEndOfTerm ?? false,
          cancel_reason_code:
            this.chargeBeeConfig.defaultCancelReasonCode ?? 'customer_request',
        })
        .request();
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  /**
   * Pauses a subscription in Chargebee.
   *
   * The subscription moves to `paused` state; Chargebee stops generating
   * invoices until the subscription is resumed.
   *
   * @param subscriptionId - The Chargebee subscription ID to pause.
   */
  async pauseSubscription(subscriptionId: string): Promise<void> {
    try {
      await chargebee.subscription.pause(subscriptionId, {}).request();
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  /**
   * Resumes a previously paused subscription in Chargebee.
   *
   * @param subscriptionId - The Chargebee subscription ID to resume.
   */
  async resumeSubscription(subscriptionId: string): Promise<void> {
    try {
      await chargebee.subscription.resume(subscriptionId, {}).request();
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  /**
   * Returns a detailed price breakdown for a Chargebee invoice including
   * tax and the amount excluding tax.
   *
   * Chargebee stores amounts as units (not cents), so no conversion needed.
   *
   * @param invoiceId - The Chargebee invoice ID.
   * @returns {@link TInvoicePrice} with amounts in the invoice's currency unit.
   */
  async getInvoicePriceDetails(invoiceId: string): Promise<TInvoicePrice> {
    try {
      const result = await chargebee.invoice.retrieve(invoiceId).request();
      const inv = result.invoice;
      const taxAmount: number = inv.tax ?? 0;
      const totalAmount: number = inv.total ?? 0;

      return {
        currency: (inv.currency_code ?? '').toUpperCase(),
        totalAmount,
        taxAmount,
        amountExcludingTax: totalAmount - taxAmount,
      };
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  /**
   * Sends a hosted payment page link for the given Chargebee invoice.
   *
   * Uses Chargebee's `collect_payment` with `payment_source_id` omitted,
   * which results in the payment link being sent via the Chargebee notification
   * configured on the site.
   *
   * @param invoiceId - The Chargebee invoice ID.
   */
  async sendPaymentLink(invoiceId: string): Promise<void> {
    try {
      // Using collect_payment without a payment_source triggers Chargebee to
      // send the hosted payment page link to the customer by email
      // (based on site notification settings).
      await chargebee.invoice.collect_payment(invoiceId, {}).request();
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  /**
   * Checks whether a plan-type Item exists and is active in Chargebee.
   *
   * @param productId - The Chargebee Item ID.
   * @returns `true` if the Item is active, `false` if archived or not found.
   */
  async checkProductExists(productId: string): Promise<boolean> {
    try {
      const result = await chargebee.item.retrieve(productId).request();
      return result.item.status === 'active';
    } catch (error) {
      const cbError = error as {api_error_code?: string; http_status?: number};
      if (
        cbError.api_error_code === 'resource_not_found' ||
        cbError.http_status === 404
      ) {
        return false;
      }
      throw new Error(JSON.stringify(error));
    }
  }
}
