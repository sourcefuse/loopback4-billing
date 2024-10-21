import {
  Component,
  config,
  ContextTags,
  CoreBindings,
  inject,
  injectable,
  ProviderMap,
} from '@loopback/core';
import {RestApplication} from '@loopback/rest';
import {BillingComponentBindings} from './keys';
import {BillingProvider} from './providers';
import {BillingComponentOptions, DEFAULT_BILLING_OPTIONS} from './types';

// Configure the binding for BillingComponent
@injectable({tags: {[ContextTags.KEY]: BillingComponentBindings.COMPONENT}})
export class BillingComponent implements Component {
  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    private application: RestApplication,
    @config()
    private options: BillingComponentOptions = DEFAULT_BILLING_OPTIONS,
  ) {}

  providers?: ProviderMap = {
    [BillingComponentBindings.BillingProvider.key]: BillingProvider,
  };
}
