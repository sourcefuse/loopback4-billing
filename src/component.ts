import {
  Application,
  injectable,
  Component,
  config,
  ContextTags,
  CoreBindings,
  inject,
  ProviderMap,
} from '@loopback/core';
import {BillingComponentBindings} from './keys';
import {DEFAULT_BILLING_OPTIONS, BillingComponentOptions} from './types';
import {RestApplication} from '@loopback/rest';
import { BillingProvider } from './providers';

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
