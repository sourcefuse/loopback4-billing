/* eslint-disable @typescript-eslint/naming-convention */

import {inject} from '@loopback/core';
import Stripe from 'stripe';
import {
  CollectionMethod,
  RecurringInterval,
  TInvoice,
  TInvoicePdf,
  TInvoicePaymentDetails,
  TInvoicePrice,
  TPaymentIntent,
  TPaymentMethod,
  TPrice,
  TProduct,
  TSubscriptionCreate,
  TSubscriptionResult,
  TSubscriptionUpdate,
  Transaction,
} from '../../../types';
import {
  StripeCustomerAdapter,
  StripeInvoiceAdapter,
  StripePaymentAdapter,
  StripePaymentIntentAdapter,
  StripeSubscriptionAdapter,
} from './adapter';
import {StripeBindings} from './key';
import {
  IStripeCustomer,
  IStripeInvoice,
  IStripePaymentSource,
  IStripeService,
  StripeConfig,
  StripeLegacySource,
} from './type';
export class StripeService implements IStripeService {
  /**
   * Stripe SDK instance. `protected` to allow subclasses (and test doubles)
   * to substitute the instance without re-opening the class.
   */
  protected stripe: Stripe;
  stripeCustomerAdapter: StripeCustomerAdapter;
  stripeInvoiceAdapter: StripeInvoiceAdapter;
  stripePaymentAdapter: StripePaymentAdapter;
  stripeSubscriptionAdapter: StripeSubscriptionAdapter;
  stripePaymentIntentAdapter: StripePaymentIntentAdapter;

  constructor(
    @inject(StripeBindings.config, {optional: true})
    private readonly stripeConfig: StripeConfig,
  ) {
    this.stripe = new Stripe(stripeConfig.secretKey ?? '', {
      apiVersion: '2024-09-30.acacia', // Update to latest API version as needed
    });
    this.stripeCustomerAdapter = new StripeCustomerAdapter();
    this.stripeInvoiceAdapter = new StripeInvoiceAdapter();
    this.stripePaymentAdapter = new StripePaymentAdapter(
      stripeConfig.cardDefaults,
    );
    this.stripeSubscriptionAdapter = new StripeSubscriptionAdapter();
    this.stripePaymentIntentAdapter = new StripePaymentIntentAdapter();
  }

  async createCustomer(customerDto: IStripeCustomer): Promise<IStripeCustomer> {
    const customer = await this.stripe.customers.create(
      this.stripeCustomerAdapter.adaptFromModel(customerDto),
    );
    return this.stripeCustomerAdapter.adaptToModel(customer); // Adjust this based on TCustomer interface
  }

  async getCustomers(customerId: string): Promise<IStripeCustomer> {
    const customer = await this.stripe.customers.retrieve(customerId);
    return this.stripeCustomerAdapter.adaptToModel(customer);
  }

  async updateCustomerById(
    customerId: string,
    customerDto: Partial<IStripeCustomer>,
  ): Promise<void> {
    const address = {
      line1: customerDto.billingAddress?.line1,
      line2: customerDto.billingAddress?.line2,
      city: customerDto.billingAddress?.city,
      state: customerDto.billingAddress?.state,
      postal_code: customerDto.billingAddress?.zip,
      country: customerDto.billingAddress?.country,
    };
    const transformedDto = {
      ...(customerDto.email && {email: customerDto.email}),
      ...(customerDto.billingAddress && {address: address}),
      ...(customerDto.phone && {phone: customerDto.phone}),
      ...(customerDto.options && {options: customerDto.options}),
    };
    await this.stripe.customers.update(customerId, transformedDto);
  }

  async deleteCustomer(customerId: string): Promise<void> {
    await this.stripe.customers.del(customerId);
  }

  async createPaymentSource(
    paymentDto: IStripePaymentSource,
  ): Promise<IStripePaymentSource> {
    if (!paymentDto.options?.token) {
      throw new Error('token is not provided');
    }
    const paymentMethod = await this.stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: paymentDto.options?.token, // Use the token received from Stripe Elements
      },
    });

    // Step 3: Attach the payment method to the customer
    const paymentRes = await this.stripe.paymentMethods.attach(
      paymentMethod.id,
      {
        customer: paymentDto.customerId,
      },
    );

    return this.stripePaymentAdapter.adaptToModel(paymentRes);
  }

  async retrievePaymentSource(
    paymentSourceId: string,
  ): Promise<IStripePaymentSource> {
    const paymentSource =
      await this.stripe.paymentMethods.retrieve(paymentSourceId);
    return this.stripePaymentAdapter.adaptToModel(paymentSource);
  }

  async deletePaymentSource(paymentSourceId: string): Promise<void> {
    await this.stripe.paymentMethods.detach(paymentSourceId);
  }

  async applyPaymentSourceForInvoice(
    invoiceId: string,
    transaction: Transaction,
  ): Promise<IStripeInvoice> {
    try {
      if (transaction.paymentMethod !== 'payment_source') {
        await this.stripe.invoices.update(invoiceId, {
          metadata: {
            paymentInfo: transaction.comment ?? 'Paid via bank transfer',
          },
        });
        const invoiceResp = await this.stripe.invoices.pay(invoiceId, {
          paid_out_of_band: true,
        });
        return this.stripeInvoiceAdapter.adaptToModel(invoiceResp);
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

      const paidInvoice = await this.stripe.invoices.pay(invoiceId, {
        payment_method: transaction.paymentSourceId,
      });
      return this.stripeInvoiceAdapter.adaptToModel(paidInvoice);
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  async createInvoice(invoice: IStripeInvoice): Promise<IStripeInvoice> {
    const addr = invoice.shippingAddress;
    const shippingName = addr
      ? [addr.firstName ?? '', addr.lastName ?? ''].join(' ').trim()
      : '';

    const createParams: Stripe.InvoiceCreateParams = {
      customer: invoice.customerId,
      auto_advance: invoice.options?.autoAdvance ?? false,
      ...(addr && shippingName
        ? {
            shipping_details: {
              name: shippingName,
              address: {
                city: addr.city,
                country: addr.country,
                line1: addr.line1,
                line2:
                  [addr.line2, addr.line3].filter(Boolean).join(' ') ||
                  undefined,
                postal_code: addr.zip,
                state: addr.state,
              },
              phone: addr.phone,
            },
          }
        : {}),
    };

    const createdInvoice = await this.stripe.invoices.create(createParams);
    // First, create invoice items for the customer
    for (const lineItem of invoice.charges ?? []) {
      // Assuming items is an array in TInvoice
      await this.stripe.invoiceItems.create({
        customer: invoice.customerId,
        amount: lineItem.amount,
        currency: invoice.currencyCode,
        description: lineItem.description,
        invoice: createdInvoice.id,
      });
    }
    const finalizedInvoice = await this.stripe.invoices.finalizeInvoice(
      createdInvoice.id,
    );

    return this.stripeInvoiceAdapter.adaptToModel(finalizedInvoice);
  }
  async retrieveInvoice(invoiceId: string): Promise<TInvoice> {
    const invoice = await this.stripe.invoices.retrieve(invoiceId);
    return this.stripeInvoiceAdapter.adaptToModel(invoice);
  }

  async updateInvoice(
    invoiceId: string,
    invoice: Partial<IStripeInvoice>,
  ): Promise<IStripeInvoice> {
    const updateData: Stripe.InvoiceUpdateParams = {};
    if (invoice.shippingAddress) {
      const shippingDetails = this.buildShippingDetails(
        invoice.shippingAddress,
      );
      if (shippingDetails) {
        updateData.shipping_details = shippingDetails;
      }
    }
    const updatedInvoice = await this.stripe.invoices.update(
      invoiceId,
      updateData,
    );
    return this.stripeInvoiceAdapter.adaptToModel(updatedInvoice);
  }

  private buildShippingDetails(
    addr: IStripeInvoice['shippingAddress'],
  ): Stripe.InvoiceUpdateParams.ShippingDetails | undefined {
    const name = [addr?.firstName ?? '', addr?.lastName ?? ''].join(' ').trim();
    if (!name) return undefined;
    return {
      name,
      address: {
        line1: addr?.line1,
        line2: addr?.line2,
        city: addr?.city,
        state: addr?.state,
        postal_code: addr?.zip,
        country: addr?.country,
      },
      phone: addr?.phone,
    };
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    await this.stripe.invoices.del(invoiceId);
  }

  async getPaymentStatus(invoiceId: string): Promise<boolean> {
    const invoice = await this.stripe.invoices.retrieve(invoiceId);
    return invoice.status === 'paid';
  }

  // ---------------------------------------------------------------------------
  // ISubscriptionService implementation
  // ---------------------------------------------------------------------------

  /**
   * Creates a new product in Stripe and returns the product's external ID.
   *
   * @param product - Product details (name, optional description and metadata).
   * @returns The Stripe product ID.
   */
  async createProduct(product: TProduct): Promise<string> {
    const created = await this.stripe.products.create({
      name: product.name,
      description: product.description,
      metadata: product.metadata,
    });
    return created.id;
  }

  /**
   * Creates a recurring price in Stripe and returns the normalised {@link TPrice}.
   *
   * @param price - Price configuration including currency, amount and recurrence.
   * @returns The created price with its Stripe-assigned ID.
   */
  async createPrice(price: TPrice): Promise<TPrice> {
    const created = await this.stripe.prices.create({
      currency: price.currency,
      unit_amount: price.unitAmount,
      product: price.product,
      recurring: price.recurring
        ? {
            interval: price.recurring
              .interval as Stripe.PriceCreateParams.Recurring.Interval,
            interval_count: price.recurring.intervalCount,
          }
        : undefined,
      metadata: price.metadata,
    });

    return {
      id: created.id,
      currency: created.currency,
      unitAmount: created.unit_amount ?? 0,
      product:
        typeof created.product === 'string'
          ? created.product
          : (created.product?.id ?? ''),
      recurring: created.recurring
        ? {
            interval: created.recurring.interval as RecurringInterval,
            intervalCount: created.recurring.interval_count,
          }
        : undefined,
      metadata: created.metadata as Record<string, string>,
      active: created.active,
    };
  }

  /**
   * Creates a new subscription in Stripe.
   *
   * Uses `payment_behavior: 'default_incomplete'` so the subscription starts
   * in an `incomplete` state until the first payment is confirmed, which is
   * the recommended Stripe pattern for SCA-compliant flows.
   *
   * @param subscription - Subscription parameters including customer, price and collection method.
   * @returns The Stripe subscription ID.
   */
  async createSubscription(subscription: TSubscriptionCreate): Promise<string> {
    const params = this.stripeSubscriptionAdapter.adaptFromModel(subscription);
    const created = await this.stripe.subscriptions.create({
      ...params,
      payment_behavior: (subscription.paymentBehavior ??
        this.stripeConfig.defaultPaymentBehavior ??
        'default_incomplete') as Stripe.SubscriptionCreateParams.PaymentBehavior,
    });
    return created.id;
  }

  /**
   * Retrieves the current state of a subscription from Stripe.
   *
   * @param subscriptionId - The Stripe subscription ID.
   * @returns A normalised {@link TSubscriptionResult}.
   */
  async getSubscription(subscriptionId: string): Promise<TSubscriptionResult> {
    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);
    return this.stripeSubscriptionAdapter.adaptToModel(subscription);
  }

  /**
   * Upgrades or downgrades an existing subscription.
   *
   * Handles the edge case where a subscription is still `incomplete` (first
   * payment not yet confirmed): the incomplete subscription is cancelled and a
   * fresh one is created so the customer can retry payment.
   *
   * For active subscriptions the Stripe proration behaviour is controlled by
   * {@link TSubscriptionUpdate.prorationBehavior}.
   *
   * @param subscriptionId - The Stripe subscription ID to modify.
   * @param updates - The new price and optional proration behaviour.
   * @returns A normalised {@link TSubscriptionResult} reflecting the change.
   */
  async updateSubscription(
    subscriptionId: string,
    updates: TSubscriptionUpdate,
  ): Promise<TSubscriptionResult> {
    const existing = await this.stripe.subscriptions.retrieve(subscriptionId);

    if (existing.status === 'incomplete') {
      // Cancel the incomplete subscription and create a fresh one so the
      // customer gets a new payment confirmation link.
      await this.stripe.subscriptions.cancel(subscriptionId);
      const newId = await this.createSubscription({
        customerId: existing.customer as string,
        priceRefId: updates.priceRefId ?? '',
        collectionMethod:
          updates.collectionMethod ?? CollectionMethod.CHARGE_AUTOMATICALLY,
        daysUntilDue: updates.daysUntilDue,
      });
      return {
        id: newId,
        status: 'incomplete',
        customerId: existing.customer as string,
      };
    }

    const items = existing.items?.data;
    if (!items || items.length === 0) {
      throw new Error(
        `Subscription ${subscriptionId} has no items and cannot be updated`,
      );
    }

    const priceItemId = items[0].id;
    const updated = await this.stripe.subscriptions.update(subscriptionId, {
      proration_behavior:
        updates.prorationBehavior as Stripe.SubscriptionUpdateParams.ProrationBehavior,
      items: [{id: priceItemId, price: updates.priceRefId}],
    });
    return this.stripeSubscriptionAdapter.adaptToModel(updated);
  }

  /**
   * Cancels a subscription immediately with proration.
   *
   * After cancellation any open invoices are voided and any draft invoices are
   * finalised then voided, ensuring the customer is not charged for the
   * remaining period.
   *
   * @param subscriptionId - The Stripe subscription ID to cancel.
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.cancel(subscriptionId);

    // Best-effort: void any remaining open/draft invoices after cancellation.
    // Errors here should not fail the cancel response.
    try {
      const invoices = await this.stripe.invoices.list({
        subscription: subscriptionId,
      });

      await Promise.all(
        invoices.data.map(async invoice => {
          if (invoice.status === 'open' && invoice.id) {
            return this.stripe.invoices.voidInvoice(invoice.id);
          }
          if (invoice.status === 'draft' && invoice.id) {
            await this.stripe.invoices.finalizeInvoice(invoice.id);
            return this.stripe.invoices.voidInvoice(invoice.id);
          }
        }),
      );
    } catch (err) {
      // Invoice cleanup is best-effort after cancellation.
      // The subscription is already cancelled at this point, so do not
      // propagate cleanup failures as cancel failures.
      process.emitWarning(
        `[StripeService] cancelSubscription: invoice cleanup failed for ${subscriptionId}: ${String(
          err,
        )}`,
      );
    }
  }

  /**
   * Pauses a subscription by marking future invoices as uncollectible.
   * The subscription remains active in Stripe but no charges are attempted.
   *
   * @param subscriptionId - The Stripe subscription ID to pause.
   */
  async pauseSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.update(subscriptionId, {
      pause_collection: {behavior: 'mark_uncollectible'},
    });
  }

  /**
   * Resumes a previously paused subscription by clearing the pause collection.
   *
   * @param subscriptionId - The Stripe subscription ID to resume.
   */
  async resumeSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.update(subscriptionId, {
      // Stripe clears pause_collection by passing an empty string.
      // The SDK types do not model this; cast through unknown to preserve
      // intent without using any.
      // Ref: https://stripe.com/docs/billing/subscriptions/pause-payment
      pause_collection:
        '' as unknown as Stripe.SubscriptionUpdateParams.PauseCollection,
    });
  }

  /**
   * Returns a detailed price breakdown for an invoice including tax and the
   * amount excluding tax.
   *
   * @param invoiceId - The Stripe invoice ID.
   * @returns {@link TInvoicePrice} with amounts in the invoice's minor currency unit.
   */
  async getInvoicePriceDetails(invoiceId: string): Promise<TInvoicePrice> {
    const invoice = await this.stripe.invoices.retrieve(invoiceId);
    const taxAmount =
      invoice.total_tax_amounts?.reduce((sum, tax) => sum + tax.amount, 0) ?? 0;

    return {
      currency: invoice.currency.toUpperCase(),
      totalAmount: invoice.total,
      taxAmount,
      amountExcludingTax: invoice.total - taxAmount,
    };
  }

  /**
   * Sends a hosted payment link for the given invoice to the customer's email.
   *
   * @param invoiceId - The Stripe invoice ID.
   */
  async sendPaymentLink(invoiceId: string): Promise<void> {
    const invoice = await this.stripe.invoices.retrieve(invoiceId);
    // sendInvoice is only valid for 'send_invoice' collection method.
    // For 'charge_automatically' invoices, Stripe handles collection automatically;
    // finalize the invoice if it is still a draft so it becomes collectable.
    if (invoice.collection_method !== 'send_invoice') {
      if (invoice.status === 'draft') {
        await this.stripe.invoices.finalizeInvoice(invoiceId);
      }
      return;
    }
    if (invoice.status === 'draft') {
      await this.stripe.invoices.finalizeInvoice(invoiceId);
    }
    await this.stripe.invoices.sendInvoice(invoiceId);
  }

  /**
   * Checks whether a product exists in Stripe and is currently active.
   *
   * @param productId - The Stripe product ID.
   * @returns `true` if the product is active, `false` if it is archived or not found.
   */
  async checkProductExists(productId: string): Promise<boolean> {
    try {
      const product = await this.stripe.products.retrieve(productId);
      return product.active === true;
    } catch (error) {
      if ((error as {code?: string}).code === 'resource_missing') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Retrieves the PDF download URL for a Stripe invoice.
   *
   * Stripe invoices have an `invoice_pdf` field that contains a temporary URL
   * to download the PDF. This URL is typically valid for a limited time.
   *
   * Note: PDF URLs are only available for finalized invoices. Draft invoices
   * will not have this field.
   *
   * @param invoiceId - The Stripe invoice ID
   * @returns Object containing the PDF URL and generation timestamp
   * @throws Error if the invoice doesn't exist or PDF URL is not available
   */
  async getInvoicePdf(invoiceId: string): Promise<TInvoicePdf> {
    try {
      // Retrieve the invoice from Stripe
      const invoice = await this.stripe.invoices.retrieve(invoiceId);

      // Check if PDF URL is available
      if (!invoice.invoice_pdf) {
        throw new Error(
          `PDF URL not available for invoice ${invoiceId}. ` +
            `The invoice may be in draft status or not finalized. ` +
            `Only finalized invoices have PDF URLs.`,
        );
      }

      // Return the PDF information using adapter
      return this.stripeInvoiceAdapter.adaptToInvoicePdf(invoice);
    } catch (error) {
      // Re-throw with better error message
      const stripeError = error as {code?: string; message?: string};
      if (stripeError.code === 'resource_missing') {
        throw new Error(`Invoice not found: ${invoiceId}`);
      }
      throw error;
    }
  }

  /**
   * Retrieves payment method details associated with a Stripe invoice.
   *
   * This method retrieves the invoice, expands to get the charge and payment
   * method details, and returns comprehensive payment information.
   *
   * @param invoiceId - The Stripe invoice ID
   * @returns Payment details including method, amount, and status
   * @throws Error if invoice not found or no payment available
   */
  async getInvoicePaymentDetails(
    invoiceId: string,
  ): Promise<TInvoicePaymentDetails> {
    try {
      // Retrieve the invoice with expanded charge and payment method
      const invoice = await this.stripe.invoices.retrieve(invoiceId, {
        expand: ['charge', 'default_payment_method'],
      });

      // Check if invoice has a charge
      if (!invoice.charge) {
        throw new Error(
          `No payment found for invoice ${invoiceId}. The invoice may not be paid yet.`,
        );
      }

      const charge = invoice.charge as Stripe.Charge;

      // Get payment method details
      let paymentMethod: TPaymentMethod;

      if (charge.payment_method) {
        // Retrieve the payment method
        const pm = await this.stripe.paymentMethods.retrieve(
          charge.payment_method as string,
        );
        paymentMethod = this.stripePaymentAdapter.adaptPaymentMethod(pm);
      } else if (charge.source) {
        // Legacy source-based payment
        const source = charge.source as unknown as StripeLegacySource;
        paymentMethod = this.stripePaymentAdapter.adaptSource(source);
      } else {
        throw new Error('No payment method information available');
      }

      // Return using adapter
      return this.stripeInvoiceAdapter.adaptToPaymentDetails(
        invoice,
        paymentMethod,
      );
    } catch (error) {
      const stripeError = error as {code?: string; message?: string};
      if (stripeError.code === 'resource_missing') {
        throw new Error(`Invoice not found: ${invoiceId}`);
      }
      throw error;
    }
  }

  /**
   * Retrieves a Stripe payment intent by ID.
   *
   * Payment intents represent the payment flow from initiation to completion.
   * This method returns comprehensive payment tracking information.
   *
   * @param paymentIntentId - The Stripe payment intent ID
   * @returns Payment intent details including status, amount, and method
   * @throws Error if payment intent not found
   */
  async getPaymentIntent(paymentIntentId: string): Promise<TPaymentIntent> {
    try {
      // Retrieve the payment intent with expanded payment method
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentIntentId,
        {
          expand: ['payment_method', 'latest_charge'],
        },
      );

      // Adapt payment method if available
      let paymentMethod: TPaymentMethod | undefined;
      if (paymentIntent.payment_method) {
        if (typeof paymentIntent.payment_method === 'string') {
          // If it's just an ID, retrieve the full payment method
          const pm = await this.stripe.paymentMethods.retrieve(
            paymentIntent.payment_method,
          );
          paymentMethod = this.stripePaymentAdapter.adaptPaymentMethod(pm);
        } else {
          // Already expanded
          paymentMethod = this.stripePaymentAdapter.adaptPaymentMethod(
            paymentIntent.payment_method as Stripe.PaymentMethod,
          );
        }
      }

      // Return using adapter
      return this.stripePaymentIntentAdapter.adaptToModel(
        paymentIntent,
        paymentMethod,
      );
    } catch (error) {
      const stripeError = error as {code?: string; message?: string};
      if (stripeError.code === 'resource_missing') {
        throw new Error(`Payment intent not found: ${paymentIntentId}`);
      }
      throw error;
    }
  }
}
