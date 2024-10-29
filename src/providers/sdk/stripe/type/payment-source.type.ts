import {TPaymentSource} from '../../../../types';

export interface IStripePaymentSource extends TPaymentSource {
  options?: {
    token?: string
  }
}
