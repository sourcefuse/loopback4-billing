/* eslint-disable @typescript-eslint/naming-convention */
import {inject} from '@loopback/core';
import Stripe from 'stripe';
import {TInvoice, Transaction} from '../../../types';
import {
  StripeCustomerAdapter,
  StripeInvoiceAdapter,
  StripePaymentAdapter,
} from './adapter';
import {StripeBindings} from './key';
import {
  IStripeCustomer,
  IStripeInvoice,
  IStripePaymentSource,
  IStripeService,
  StripeConfig,
} from './type';
export class StripeService implements IStripeService {
  private stripe: Stripe;
  stripeCustomerAdapter: StripeCustomerAdapter;
  stripeInvoiceAdapter: StripeInvoiceAdapter;
  stripePaymentAdapter: StripePaymentAdapter;

  constructor(
    @inject(StripeBindings.config, {optional: true})
    private readonly stripeConfig: StripeConfig,
  ) {
    this.stripe = new Stripe(stripeConfig.secretKey ?? '', {
      apiVersion: '2024-09-30.acacia', // Update to latest API version as needed
    });
    this.stripeCustomerAdapter = new StripeCustomerAdapter();
    this.stripeInvoiceAdapter = new StripeInvoiceAdapter();
    this.stripePaymentAdapter = new StripePaymentAdapter();
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
    const createdInvoice = await this.stripe.invoices.create({
      customer: invoice.customerId,
      auto_advance: invoice.options?.autoAdvnace ?? false, // Optional
      shipping_details: {
        address: {
          city: invoice.shippingAddress?.city,
          country: invoice.shippingAddress?.country,
          line1: invoice.shippingAddress?.line1,
          line2:
            invoice.shippingAddress?.line2 +
            ' ' +
            invoice.shippingAddress?.line3,
          postal_code: invoice.shippingAddress?.zip,
          state: invoice.shippingAddress?.state,
        },
        name: invoice.customerId,
      },
    });
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
    // Create the update object conditionally based on which fields are defined
    const updateData: Stripe.InvoiceUpdateParams = {};

    if (invoice.shippingAddress) {
      updateData.shipping_details = {
        name: [
          invoice.shippingAddress.firstName ?? '', // Avoid 'undefined' in the name
          invoice.shippingAddress.lastName ?? '',
        ]
          .join(' ')
          .trim(), // Trim to avoid extra spaces
        address: {
          line1: invoice.shippingAddress.line1 ?? undefined, // Only set if defined
          line2: invoice.shippingAddress.line2 ?? undefined,
          city: invoice.shippingAddress.city ?? undefined,
          state: invoice.shippingAddress.state ?? undefined,
          postal_code: invoice.shippingAddress.zip ?? undefined,
          country: invoice.shippingAddress.country ?? undefined,
        },
        phone: invoice.shippingAddress.phone ?? undefined, // Only set phone if provided
      };
    }

    // Call the Stripe API with the built update data
    const updatedInvoice = await this.stripe.invoices.update(
      invoiceId,
      updateData,
    );

    // Adapt the updated invoice to your model
    return this.stripeInvoiceAdapter.adaptToModel(updatedInvoice);
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    await this.stripe.invoices.del(invoiceId);
  }

  async getPaymentStatus(invoiceId: string): Promise<boolean> {
    const invoice = await this.stripe.invoices.retrieve(invoiceId);
    return invoice.status === 'paid';
  }
}
