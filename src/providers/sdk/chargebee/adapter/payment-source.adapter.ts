import { IChargeBeePaymentSource, IPaymentSource } from "../type";

export class PaymentSourceAdapter {
    constructor() {}

    convert(paymentSource: IPaymentSource): IChargeBeePaymentSource {
        return {
            id: paymentSource.id,
            customerId: paymentSource.customer_id,
            card: {
                gatewayAccountId: paymentSource.gateway_account_id ?? '',
                number: paymentSource.card?.masked_number ?? '',
                expiryMonth: paymentSource.card?.expiry_month ?? 0,
                expiryYear: paymentSource.card?.expiry_year ?? 0,
                cvv: "***"
            }
        };
    }
}
