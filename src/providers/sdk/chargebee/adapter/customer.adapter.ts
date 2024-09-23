import { IChargeBeeCustomer, IChargeBeeInvoice, ICustomer, IDiscount, IInvoice } from "../type";

export class CustomerAdapter{
    constructor(){}

    convert(customer:ICustomer):IChargeBeeCustomer{
    
      const res:IChargeBeeCustomer={
        id:customer.id,
        firstName:customer.first_name??"",
        lastName:customer.last_name??"",
        email:customer.email??"",
        company:customer.company,
        phone:customer.phone,
        billingAddress:{
          ...customer.billing_address,
          firstName:customer.billing_address?.first_name,
          lastName:customer.billing_address?.last_name
        }
      }
      return res;
    }
}