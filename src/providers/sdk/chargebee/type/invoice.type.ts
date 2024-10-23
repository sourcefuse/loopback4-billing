import {TInvoice} from '../../../../types';

export type IApplyOn = 'invoice_amount' | 'specific_item_price';
export interface IDiscount {
  applyOn: IApplyOn;
}
export type AutoCollection = 'on' | 'off';

export interface IChargeBeeInvoice extends TInvoice {
  charges?: ICharge[];
  options: {
    discounts?: Array<IDiscount>;
    autoCollection?: AutoCollection;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    [key: string]: any; //NOSONAR
  };
}

export interface IAddressDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  line3?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface ICharge {
  amount: number;
  description: string;
}
