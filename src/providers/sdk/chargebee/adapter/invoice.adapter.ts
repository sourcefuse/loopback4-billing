import {AnyObject} from '@loopback/repository';
import {ICharge, IChargeBeeInvoice, IDiscount} from '../type';
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
}
