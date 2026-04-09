import {inject, Provider} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {BillingComponentBindings} from '../keys';
import {IService} from '../types';

export class BillingProvider implements Provider<IService> {
  constructor(
    @inject(BillingComponentBindings.RestProvider, {optional: true})
    private readonly restProvider?: IService,
    @inject(BillingComponentBindings.SDKProvider, {optional: true})
    private readonly sdkProvider?: IService,
  ) {}

  getProvider(): IService {
    if (this.sdkProvider && this.restProvider) {
      throw new HttpErrors.NotAcceptable();
    } else if (this.sdkProvider) {
      return this.sdkProvider;
    } else if (this.restProvider) {
      return this.restProvider;
    } else {
      throw new HttpErrors.UnprocessableEntity('ProviderNotFound');
    }
  }

  value(): IService {
    return this.getProvider();
  }
}
