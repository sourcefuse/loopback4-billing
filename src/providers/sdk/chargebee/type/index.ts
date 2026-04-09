import {IService, ISubscriptionService, Transaction} from '../../../../types';
import {IChargeBeeCustomer} from './customer.type';
import {IChargeBeeInvoice} from './invoice.type';
import {IChargeBeePaymentSource} from './payment-source.type';

export const BillingDBSourceName = 'BillingDB';

/**
 * Full Chargebee service interface combining one-time billing ({@link IService})
 * and recurring-subscription management ({@link ISubscriptionService}).
 *
 * All subscription methods map to Chargebee's Items/Item-Prices/Subscriptions API
 * which is the current (v2) Chargebee data model — matching our generalised types:
 *
 * | Library type       | Chargebee equivalent      |
 * |--------------------|---------------------------|
 * | TProduct           | Item (type: plan)         |
 * | TPrice             | ItemPrice                 |
 * | TSubscriptionCreate| Subscription (create_with_items) |
 * | TSubscriptionUpdate| Subscription (update_for_items)  |
 * | TSubscriptionResult| Subscription object        |
 */
export interface IChargeBeeService extends IService, ISubscriptionService {
  createCustomer(customerDto: IChargeBeeCustomer): Promise<IChargeBeeCustomer>;
  getCustomers(customerId: string): Promise<IChargeBeeCustomer>;
  updateCustomerById(
    customerId: string,
    customerDto: Partial<IChargeBeeCustomer>,
  ): Promise<void>;
  createPaymentSource(
    paymentDto: IChargeBeePaymentSource,
  ): Promise<IChargeBeePaymentSource>;
  applyPaymentSourceForInvoice(
    invoiceId: string,
    transaction: Transaction,
  ): Promise<IChargeBeeInvoice>;
  retrievePaymentSource(
    paymentSourceId: string,
  ): Promise<IChargeBeePaymentSource>;
  deletePaymentSource(paymentSourceId: string): Promise<void>;
  createInvoice(invoice: IChargeBeeInvoice): Promise<IChargeBeeInvoice>;
  retrieveInvoice(invoiceId: string): Promise<IChargeBeeInvoice>;
  updateInvoice(
    invoiceId: string,
    invoice: Partial<IChargeBeeInvoice>,
  ): Promise<IChargeBeeInvoice>;
  deleteInvoice(invoiceId: string): Promise<void>;
  getPaymentStatus(invoiceId: string): Promise<boolean>;
}

export * from './invoice.type';
export * from './payment-source.type';
export * from './customer.type';
export * from './chargebee-config.type';
