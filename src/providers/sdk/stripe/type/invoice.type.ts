import {TInvoice} from '../../../../types';
import {IAddressDto} from '../../chargebee';

export interface IStripeInvoice extends TInvoice {
  shippingAddress: IAddressDto | undefined,
  options?: {
    autoAdvnace?: boolean
  }
}

