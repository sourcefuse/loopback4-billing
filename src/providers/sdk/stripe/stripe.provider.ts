import {Provider, inject} from '@loopback/core';
import {StripeBindings} from './key';
import {StripeService} from './stripe.service';
import {IStripeService, StripeConfig} from './type';

export class StripeServiceProvider implements Provider<IStripeService> {
  constructor(
    @inject(StripeBindings.config, {optional: true})
    private readonly stripeConfig: StripeConfig,
  ) { }

  value(): IStripeService {
    return new StripeService(this.stripeConfig);
  }
}
