import { ICharge, IChargeBeeInvoice, IDiscount, IInvoice } from "../type";

export class InvoiceAdapter{
    constructor(){}

    convert(invoice:IInvoice):IChargeBeeInvoice{
    let discounts:IDiscount[]=[];
      if(invoice.discounts){
        invoice.discounts.forEach(discount=>{
          if(discount.entity_type==='document_level_coupon'){
            discounts.push({apply_on:'invoice_amount'});
          }else{
            discounts.push({apply_on:'specific_item_price'});
          }
        })
      }
      const charges:ICharge[]=invoice.line_items?.map(item=>{
        const charge:ICharge={
          amount:item.amount?item.amount/100:0,
          description:item.description,
        }
        return charge
      })??[];
      const res:IChargeBeeInvoice={
        id:invoice.id,
        customerId:invoice.customer_id,
        shippingAddress:{
          ...invoice.shipping_address,
          firstName:invoice.shipping_address?.first_name,
          lastName:invoice.shipping_address?.last_name
        },
        status:invoice.status,
        options:{discounts:discounts},
        charges:charges,
        currencyCode:invoice.currency_code
      }
      return res;
    }
}