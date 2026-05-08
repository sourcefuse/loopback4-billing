import {
  TInvoicePdf,
  TInvoicePaymentDetails,
  TPaymentMethod,
} from '../../../../types';
import {ChargebeeInvoice, ICharge, IChargeBeeInvoice, IDiscount} from '../type';
import {AnyObject} from '@loopback/repository';
export class InvoiceAdapter {
  constructor() {}

  convert(invoice: AnyObject): IChargeBeeInvoice {
    const discounts: IDiscount[] = [];
    if (invoice.discounts) {
      /* eslint-disable-next-line @typescript-eslint/naming-convention */
      invoice.discounts.forEach((discount: {entity_type: string}) => {
        if (discount.entity_type === 'document_level_coupon') {
          discounts.push({applyOn: 'invoice_amount'});
        } else {
          discounts.push({applyOn: 'specific_item_price'});
        }
      });
    }
    const charges: ICharge[] =
      invoice.line_items?.map((item: {amount: number; description: string}) => {
        const charge: ICharge = {
          amount: item.amount ? item.amount / 100 : 0,
          description: item.description,
        };
        return charge;
      }) ?? [];
    const res: IChargeBeeInvoice = {
      id: invoice.id,
      customerId: invoice.customer_id,
      shippingAddress: {
        ...invoice.shipping_address,
        firstName: invoice.shipping_address?.first_name,
        lastName: invoice.shipping_address?.last_name,
      },
      status: invoice.status,
      options: {discounts: discounts},
      charges: charges,
      currencyCode: invoice.currency_code,
    };
    return res;
  }

  /**
   * Adapts a ChargeBee invoice download result to TInvoicePdf format.
   *
   * @param download - ChargeBee download object
   * @param invoiceId - The invoice ID
   * @returns TInvoicePdf - Invoice PDF information
   */
  adaptToInvoicePdf(
    download: Record<string, unknown>,
    invoiceId: string,
  ): TInvoicePdf {
    const downloadUrl = download['download_url'];
    const pdfUrl = typeof downloadUrl === 'string' ? downloadUrl : '';
    return {
      invoiceId: invoiceId,
      pdfUrl: pdfUrl,
      generatedAt: Math.floor(Date.now() / 1000), // Current timestamp in seconds
      expiresAt: download['expires_at'] as number | undefined,
    };
  }

  /**
   * Adapts ChargeBee invoice and payment method data to TInvoicePaymentDetails format.
   *
   * @param invoice - ChargeBee invoice object
   * @param paymentMethod - Payment method details
   * @returns TInvoicePaymentDetails - Payment details for the invoice
   */
  adaptToPaymentDetails(
    invoice: ChargebeeInvoice,
    paymentMethod: TPaymentMethod,
  ): TInvoicePaymentDetails {
    const id = invoice.invoiceId ?? invoice.id ?? '';
    return {
      invoiceId: id,
      paymentMethod: paymentMethod,
      paymentDate: invoice.paidAt
        ? Math.floor(new Date(invoice.paidAt).getTime() / 1000)
        : undefined,
      amount: invoice.total ?? 0,
      currency: invoice.currencyCode ?? 'USD',
      status: invoice.status ?? 'unknown',
      transactionId: id,
      description: `Payment for invoice ${id}`,
    };
  }

  /**
   * Extracts customer ID from invoice.
   *
   * @param invoice - The ChargeBee invoice
   * @returns Customer ID or empty string if not found
   */
  getCustomerIdFromInvoice(invoice: ChargebeeInvoice): string {
    const customerId =
      ((invoice as Record<string, unknown>)['customer_id'] as string) ||
      invoice.customerId;
    return customerId ?? '';
  }
}
