// import { inject } from '@loopback/core';
// import { ChargeBeeBindings } from './key';
// import { ChargeBeeConfig, IChargeBeeService, IPaymentSource } from './type';
// import chargebee from 'chargebee';

import { inject } from "@loopback/core";
import chargebee from "chargebee";
import { CustomerAdapter, InvoiceAdapter, PaymentSourceAdapter } from "./adapter";
import { ChargeBeeBindings } from "./key";
import { ChargeBeeConfig, IChargeBeeCustomer, IChargeBeeInvoice, IChargeBeePaymentSource, IChargeBeeService } from "./type";
import { Transaction } from "../../../types";


export class ChargeBeeService implements IChargeBeeService {
  invoiceAdapter: InvoiceAdapter;
  customerAdapter: CustomerAdapter;
  paymentSource: PaymentSourceAdapter;
  constructor(
    @inject(ChargeBeeBindings.config, { optional: true })
    private readonly chargeBeeConfig: ChargeBeeConfig,
  ) {
    // config initialise
    chargebee.configure({
      site: chargeBeeConfig.site,
      api_key: chargeBeeConfig.apiKey,
    });
    this.invoiceAdapter = new InvoiceAdapter();
    this.customerAdapter = new CustomerAdapter();
    this.paymentSource = new PaymentSourceAdapter();
  }
  async createCustomer(customerDto: IChargeBeeCustomer): Promise<IChargeBeeCustomer> {
    try {
      const result = await chargebee.customer.create({
        first_name: customerDto.firstName,
        last_name: customerDto.lastName,
        email: customerDto.email,
        company: customerDto.company,
        billing_address: {
          first_name: customerDto.billingAddress?.firstName,
          last_name: customerDto.billingAddress?.lastName,
          email: customerDto.billingAddress?.email,
          company: customerDto.billingAddress?.company,
          phone: customerDto.billingAddress?.phone,
          line1: customerDto.billingAddress?.line1,
          line2: customerDto.billingAddress?.line2,
          line3: customerDto.billingAddress?.line3,
          city: customerDto.billingAddress?.city,
          state: customerDto.billingAddress?.state,
          zip: customerDto.billingAddress?.zip,
          country: customerDto.billingAddress?.country
        },
        phone: customerDto.phone
      }).request();
      return this.customerAdapter.convert(result.customer);
    } catch (error) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }

  async getCustomers(customerId: string): Promise<IChargeBeeCustomer> {
    try {
      const result = await chargebee.customer.retrieve(customerId).request();
      return this.customerAdapter.convert(result.customer);
    } catch (error) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }
  async updateCustomerById(customerId: string, customerDto: Partial<IChargeBeeCustomer>): Promise<void> {
    try {

      const billingAddress = {
        first_name: customerDto.billingAddress?.firstName,
        last_name: customerDto.billingAddress?.lastName,
        email: customerDto.billingAddress?.email,
        company: customerDto.billingAddress?.company,
        phone: customerDto.billingAddress?.phone,
        line1: customerDto.billingAddress?.line1,
        line2: customerDto.billingAddress?.line2,
        line3: customerDto.billingAddress?.line3,
        city: customerDto.billingAddress?.city,
        state: customerDto.billingAddress?.state,
        zip: customerDto.billingAddress?.zip,
        country: customerDto.billingAddress?.country
      };
      const transformedDto = {
        ...customerDto.id && { id: customerDto.id },
        ...customerDto.firstName && { first_name: customerDto.firstName },
        ...customerDto.lastName && { last_name: customerDto.lastName },
        ...customerDto.email && { email: customerDto.email },
        ...customerDto.company && { company: customerDto.company },
        ...customerDto.billingAddress && { billing_address: billingAddress },
        ...customerDto.phone && { phone: customerDto.phone },
        ...customerDto.options && { options: customerDto.options }
      }

      await chargebee.customer.update(customerId, transformedDto).request();

    } catch (error) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }

  async deleteCustomer(customerId: string): Promise<void> {
    try {
      await chargebee.customer.delete(customerId).request();
    } catch (error) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }
  async createPaymentSource(paymentDto: IChargeBeePaymentSource): Promise<IChargeBeePaymentSource> {
    try {
      const result = await chargebee.payment_source
        .create_card({
          customer_id: paymentDto.customerId,
          card: {
            gateway_account_id: paymentDto.card.gatewayAccountId,
            number: paymentDto.card.number,
            expiry_month: paymentDto.card.expiryMonth,
            expiry_year: paymentDto.card.expiryYear,
            cvv: paymentDto.card.cvv,
          }
        })
        .request();

      return this.paymentSource.convert(result.payment_source);
    } catch (error) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }
  async applyPaymentSourceForInvoice(invoiceId: string, transaction: Transaction,): Promise<IChargeBeeInvoice> {
    try {


      if (transaction.paymentMethod !== 'payment_source') {
        const result = await chargebee.invoice.record_payment(invoiceId, {
          comment: transaction.comment,
          transaction: {
            amount: transaction.amount,
            payment_method: transaction.paymentMethod,
            date: transaction.date,
            status: 'success'
          }
        }).request();
        return this.invoiceAdapter.convert(result.invoice);
      } else if (transaction.paymentMethod === 'payment_source' && !transaction.paymentMethod) {

        throw new Error('payment source id is not given for payment_method - payment_source')
      } else {
        // Do Nothing
      }


      const result = await chargebee.invoice.collect_payment(invoiceId, {
        payment_source_id: transaction.paymentSourceId
      }).request();
      return this.invoiceAdapter.convert(result.invoice);




    } catch (error) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }
  async retrievePaymentSource(paymentSourceId: string): Promise<IChargeBeePaymentSource> {
    try {
      const result = await chargebee.payment_source.retrieve(paymentSourceId).request();
      return this.paymentSource.convert(result.payment_source);
    } catch (error) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }
  async deletePaymentSource(paymentSourceId: string): Promise<void> {
    try {
      await chargebee.payment_source.delete(paymentSourceId).request();
    } catch (error) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }
  async createInvoice(invoice: IChargeBeeInvoice): Promise<IChargeBeeInvoice> {
    try {
      const result = await chargebee.invoice
        .create_for_charge_items_and_charges({
          customer_id: invoice.customerId,
          shipping_address: {
            first_name: invoice.shippingAddress?.firstName,
            last_name: invoice.shippingAddress?.lastName,
            email: invoice.shippingAddress?.email,
            company: invoice.shippingAddress?.company,
            phone: invoice.shippingAddress?.phone,
            city: invoice.shippingAddress?.city,
            state: invoice.shippingAddress?.state,
            zip: invoice.shippingAddress?.zip,
            country: invoice.shippingAddress?.country
          },
          charges: invoice.charges,
          auto_collection: invoice.options.autoCollection,
          discounts: invoice.options.discounts ?? [],
          currency_code:invoice.currencyCode
        })
        .request();
      return this.invoiceAdapter.convert(result.invoice);
    } catch (error) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }
  async retrieveInvoice(invoiceId: string): Promise<IChargeBeeInvoice> {
    try {
      const result = await chargebee.invoice.retrieve(invoiceId).request();
      return this.invoiceAdapter.convert(result.invoice);
    } catch (error) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }
  async updateInvoice(invoiceId: string, invoice: Partial<IChargeBeeInvoice>): Promise<IChargeBeeInvoice> {
    try {
      const result = await chargebee.invoice.update_details(invoiceId, {
        shipping_address: {
          first_name: invoice.shippingAddress?.firstName,
          last_name: invoice.shippingAddress?.lastName,
          email: invoice.shippingAddress?.email,
          company: invoice.shippingAddress?.company,
          phone: invoice.shippingAddress?.phone,
          city: invoice.shippingAddress?.city,
          state: invoice.shippingAddress?.state,
          zip: invoice.shippingAddress?.zip,
          country: invoice.shippingAddress?.country
        }
      }).request();
      return this.invoiceAdapter.convert(result.invoice);
    } catch (error) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }
  async deleteInvoice(invoiceId: string): Promise<void> {
    try {
      await chargebee.invoice.delete(invoiceId).request();
    } catch (error) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }
  async getPaymentStatus(invoiceId: string): Promise<boolean> {
    try {
      const result = await chargebee.invoice.retrieve(invoiceId).request();
      return result.invoice.status == 'paid' ? true : false;
    } catch (error) {
      console.log(error);
      throw new Error(JSON.stringify(error));
    }
  }
}