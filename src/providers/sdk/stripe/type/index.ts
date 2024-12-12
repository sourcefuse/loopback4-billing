import {IService} from '../../../../types';

export interface StripeConfig {
  secretKey: string;
}

export interface IStripeService extends IService {}

export * from './customer.type';
export * from './invoice.type';
export * from './payment-source.type';
