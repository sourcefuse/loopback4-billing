import {AnyObject} from '@loopback/repository';
import {IAdapter} from '../../../../types';
import {IStripeCustomer} from '../type';
export class StripeCustomerAdapter implements IAdapter<IStripeCustomer> {
  constructor() {}

  adaptToModel(resp: AnyObject): IStripeCustomer {
    const {firstName, lastName} = splitName(resp.name);
    const res: IStripeCustomer = {
      id: resp.id,
      firstName: firstName,
      lastName: lastName,
      email: resp.email,
      phone: resp.phone,
      billingAddress: {
        firstName: firstName,
        lastName: lastName,
        email: resp.email,
        phone: resp.phone,
        line1: resp.address?.line1,
        line2: resp.address?.line2,
        city: resp.address?.city,
        state: resp.address?.state,
        zip: resp.address?.postal_code,
        country: resp.address?.country,
      },
    };
    return res;
  }
  adaptFromModel(data: IStripeCustomer): AnyObject {
    return {
      name: data.firstName + ' ' + data.lastName,
      email: data.email,
      phone: data.phone,
      address: {
        line1: data.billingAddress?.line1,
        line2: data.billingAddress?.line2,
        city: data.billingAddress?.city,
        state: data.billingAddress?.state,
        country: data.billingAddress?.country,
        /* eslint-disable-next-line @typescript-eslint/naming-convention */
        postal_code: data.billingAddress?.zip,
      },
    };
  }
}

function splitName(fullName: string): {firstName: string; lastName: string} {
  const nameParts = fullName.trim().split(' ');

  if (nameParts.length === 1) {
    // If only first name is provided
    return {
      firstName: nameParts[0],
      lastName: '',
    };
  } else {
    // If both first and last names are provided
    return {
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' '), // Handles multiple middle/last names
    };
  }
}
