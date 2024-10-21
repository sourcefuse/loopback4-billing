import {IService, Transaction} from '../../../../types';
import {IChargeBeeCustomer} from './customer.type';
import {IChargeBeeInvoice} from './invoice.type';
import {IChargeBeePaymentSource} from './payment-source.type';

export interface ChargeBeeConfig {
  site: string;
  apiKey: string;
}
export const BillingDBSourceName = 'BillingDB';

export interface IChargeBeeService extends IService {
  // No Change
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
