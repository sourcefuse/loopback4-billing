import {TPaymentSource} from '../../../../types';

export interface ICardDto {
  gatewayAccountId: string;
  number: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
}

// payment attributes interface used to pass in chargebee functions
export interface IChargeBeePaymentSource extends TPaymentSource {
  customerId: string;
  card: ICardDto;
}
