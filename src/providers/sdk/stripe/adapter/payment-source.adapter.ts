import {AnyObject} from '@loopback/repository';
import {IAdapter} from '../../../../types';
import {IStripePaymentSource} from '../type';
export class StripePaymentAdapter implements IAdapter<IStripePaymentSource> {
  constructor() {}

  adaptToModel(resp: AnyObject): IStripePaymentSource {
    return {
      id: resp.id,
      customerId: resp.customer,
      card: resp.card
        ? {
            gatewayAccountId: resp.card.fingerprint, // Using fingerprint as an identifier
            number: '**** **** **** ' + resp.card.last4, // Masked card number
            expiryMonth: resp.card.exp_month,
            expiryYear: resp.card.exp_year,
            cvv: '***', // CVV is not returned by Stripe, so it should be masked
          }
        : undefined,
      options: {
        token: resp.id, // Use the payment method id as the token if needed
      },
    };
  }
  adaptFromModel(data: IStripePaymentSource): AnyObject {
    return {}; // This is intentional
  }
}
