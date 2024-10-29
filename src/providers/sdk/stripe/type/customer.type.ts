import {TCustomer} from '../../../../types';
import {IAddressDto} from '../../chargebee';

export interface IStripeCustomer extends TCustomer {
  billingAddress: IAddressDto | undefined
}
