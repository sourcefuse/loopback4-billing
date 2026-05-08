/* eslint-disable @typescript-eslint/naming-convention */
import Stripe from 'stripe';
import {AnyObject} from '@loopback/repository';
import {
  IAdapter,
  TInvoicePdf,
  TInvoicePaymentDetails,
  TPaymentMethod,
} from '../../../../types';
import {IStripeInvoice} from '../type';
export class StripeInvoiceAdapter implements IAdapter<IStripeInvoice> {
  constructor() {}

  adaptToModel(resp: AnyObject): IStripeInvoice {
    return {
      id: resp.id,
      customerId: resp.customer,
      status: resp.status,
      currencyCode: resp.currency,
      shippingAddress: resp.shipping_details?.address
        ? {
            firstName: resp.customer_name?.split(' ')[0] || '',
            lastName: resp.customer_name?.split(' ')[1] || '',
            line1: resp.shipping_details.address.line1,
            line2: resp.shipping_details.address.line2,
            city: resp.shipping_details.address.city,
            state: resp.shipping_details.address.state,
            zip: resp.shipping_details.address.postal_code,
            country: resp.shipping_details.address.country,
            phone: resp.shipping_details.phone,
            email: resp.customer_email,
          }
        : undefined,
      charges: resp.lines?.data.map(
        (
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          lineItem: any, // NOSONAR
        ) => ({
          amount: lineItem.amount / 100, // divided by 100 because the lineItem.amount is coming in cents
          description: lineItem.description,
        }),
      ),
      options: {
        autoAdvance: resp.auto_advance || false,
      },
    };
  }
  adaptFromModel(data: IStripeInvoice): AnyObject {
    const shippingDetails: AnyObject = data.shippingAddress
      ? {
          shipping_details: {
            name: [
              data.shippingAddress.firstName,
              data.shippingAddress.lastName,
            ]
              .join(' ')
              .trim(),
            address: {
              line1: data.shippingAddress.line1,
              line2: data.shippingAddress.line2,
              city: data.shippingAddress.city,
              state: data.shippingAddress.state,
              postal_code: data.shippingAddress.zip,
              country: data.shippingAddress.country,
            },
            phone: data.shippingAddress.phone,
          },
        }
      : {};

    return {
      customer: data.customerId,
      currency: data.currencyCode,
      ...shippingDetails,
      auto_advance: data.options?.autoAdvance ?? false,
    };
  }

  /**
   * Adapts a Stripe Invoice to TInvoicePdf format.
   *
   * @param invoice - Stripe Invoice object
   * @returns TInvoicePdf - Invoice PDF information
   */
  adaptToInvoicePdf(invoice: Stripe.Invoice): TInvoicePdf {
    return {
      invoiceId: invoice.id,
      pdfUrl: invoice.invoice_pdf ?? '',
      generatedAt: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * Adapts Stripe invoice and charge data to TInvoicePaymentDetails format.
   *
   * @param invoice - Stripe Invoice object
   * @param paymentMethod - Payment method details
   * @returns TInvoicePaymentDetails - Payment details for the invoice
   */
  adaptToPaymentDetails(
    invoice: Stripe.Invoice,
    paymentMethod: TPaymentMethod,
  ): TInvoicePaymentDetails {
    const charge = invoice.charge as Stripe.Charge;
    return {
      invoiceId: invoice.id,
      paymentMethod: paymentMethod,
      paymentDate: invoice.status_transitions?.paid_at ?? undefined,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      transactionId: charge.id,
      description: charge.description ?? undefined,
    };
  }
}
