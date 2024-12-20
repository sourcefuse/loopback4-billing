import {TCustomer} from '../../../../types';
import {IAddressDto} from './invoice.type';

export interface IChargeBeeCustomer extends TCustomer {
  company?: string;
  phone?: string;
  billingAddress?: IAddressDto;
}
