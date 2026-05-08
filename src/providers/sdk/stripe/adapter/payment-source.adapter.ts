import Stripe from 'stripe';
import {AnyObject} from '@loopback/repository';
import {TPaymentMethod} from '../../../../types';
import {IAdapter} from '../../../../types';
import {IStripePaymentSource, StripeLegacySource} from '../type';

// Payment method default values
const DEFAULT_EXPIRY_MONTH = 12;
const DEFAULT_EXPIRY_YEAR = 2025;
const DEFAULT_FUNDING_TYPE = 'credit';
const DEFAULT_CARD_BRAND = 'unknown';

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
  adaptFromModel(_data: IStripePaymentSource): AnyObject {
    return {}; // This is intentional
  }

  /**
   * Adapts a Stripe PaymentMethod to the generic TPaymentMethod format.
   */
  adaptPaymentMethod(pm: Stripe.PaymentMethod): TPaymentMethod {
    if (pm.type === 'card') {
      return {
        type: 'card',
        id: pm.id,
        customer: pm.customer as string,
        card: {
          brand: pm.card!.brand,
          last4: pm.card!.last4,
          expMonth: pm.card!.exp_month,
          expYear: pm.card!.exp_year,
          funding: pm.card!.funding,
          country: pm.card!.country ?? undefined,
        },
      };
    }

    // Handle other payment method types as needed
    return {
      type: pm.type,
      id: pm.id,
      customer: pm.customer as string,
    };
  }

  /**
   * Adapts a legacy Stripe Source to the generic TPaymentMethod format.
   */
  adaptSource(source: StripeLegacySource): TPaymentMethod {
    if (source.type === 'card' && source.card) {
      const card = source.card as {
        brand: string;
        last4: string;
        expMonth: number;
        expYear: number;
        funding: string;
      };
      return {
        type: 'card',
        id: source.id,
        card: {
          brand: card.brand || DEFAULT_CARD_BRAND,
          last4: card.last4 || '****',
          expMonth: card.expMonth || DEFAULT_EXPIRY_MONTH,
          expYear: card.expYear || DEFAULT_EXPIRY_YEAR,
          funding: card.funding || DEFAULT_FUNDING_TYPE,
        },
      };
    }

    return {
      type: source.type ?? 'unknown',
      id: source.id,
    };
  }
}
