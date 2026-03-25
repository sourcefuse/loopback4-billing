import {inject, Provider} from '@loopback/core';

import {HttpErrors} from '@loopback/rest';
import {BillingComponentBindings} from '../keys';
import {
  IService,
  TCustomer,
  TInvoice,
  TPaymentSource,
  Transaction,
} from '../types';

export class BillingProvider implements Provider<IService> {
  constructor(
    @inject(BillingComponentBindings.RestProvider, {optional: true})
    private readonly restProvider?: IService,
    @inject(BillingComponentBindings.SDKProvider, {optional: true})
    private readonly sdkProvider?: IService,
  ) {}

  getProvider() {
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

  async createCustomer(customerDto: TCustomer): Promise<TCustomer> {
    return this.getProvider().createCustomer(customerDto);
  }

  async getCustomers(customerId: string): Promise<TCustomer> {
    return this.getProvider().getCustomers(customerId);
  }

  async updateCustomerById(
    tenantId: string,
    customerDto: Partial<TCustomer>,
  ): Promise<void> {
    return this.getProvider().updateCustomerById(tenantId, customerDto);
  }

  async deleteCustomer(customerId: string): Promise<void> {
    return this.getProvider().deleteCustomer(customerId);
  }

  async createPaymentSource(
    paymentDto: TPaymentSource,
  ): Promise<TPaymentSource> {
    return this.getProvider().createPaymentSource(paymentDto);
  }

  async applyPaymentSourceForInvoice(
    invoiceId: string,
    transaction: Transaction,
  ): Promise<TInvoice> {
    return this.getProvider().applyPaymentSourceForInvoice(
      invoiceId,
      transaction,
    );
  }

  async retrievePaymentSource(
    paymentSourceId: string,
  ): Promise<TPaymentSource> {
    return this.getProvider().retrievePaymentSource(paymentSourceId);
  }

  async deletePaymentSource(paymentSourceId: string): Promise<void> {
    return this.getProvider().deletePaymentSource(paymentSourceId);
  }

  async createInvoice(invoice: TInvoice): Promise<TInvoice> {
    return this.getProvider().createInvoice(invoice);
  }

  async retrieveInvoice(invoiceId: string): Promise<TInvoice> {
    return this.getProvider().retrieveInvoice(invoiceId);
  }

  async updateInvoice(
    invoiceId: string,
    invoice: Partial<TInvoice>,
  ): Promise<TInvoice> {
    return this.getProvider().updateInvoice(invoiceId, invoice);
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    return this.getProvider().deleteInvoice(invoiceId);
  }

  async getPaymentStatus(invoiceId: string): Promise<boolean> {
    return this.getProvider().getPaymentStatus(invoiceId);
  }

  value() {
    return this.getProvider();
  }
}
