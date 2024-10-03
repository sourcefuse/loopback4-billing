# loopback4-billing

[![LoopBack](https://github.com/loopbackio/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png)](http://loopback.io/)

## Overview

The loopback4-billing package is designed to integrate billing functionality into LoopBack 4 applications. It provides an abstraction layer to work with billing services such as Chargebee, offering common billing operations like creating and managing customers, invoices, payment sources, and transactions.

The package uses a provider pattern to abstract different billing implementations, making it easy to switch between billing services like REST API or SDK-based providers. Currently, the example code focuses on integration with Chargebee.


## Installation

To install loopback4-billing, use `npm`:

```sh
npm install loopback4-billing
```

## Usage

### Integration in Your LoopBack 4 Application

1. Configure and load BillingComponent in the application constructor
as shown below.
```ts
import {BillingComponent, BillingComponentOptions, DEFAULT_BILLING_OPTIONS} from 'billing';
// ...
export class MyApplication extends BootMixin(ServiceMixin(RepositoryMixin(RestApplication))) {
  constructor(options: ApplicationConfig = {}) {
    const opts: BillingComponentOptions = DEFAULT_BILLING_OPTIONS;
    this.configure(BillingComponentBindings.COMPONENT).to(opts);
      // Put the configuration options here
    });
    this.component(BillingComponent);
    // ...
  }
  // ...
}
```
2. Import the BillingComponentBindings and the IService interface from loopback4-billing. Inject the BillingProvider into your controller or service where you need to perform billing operations. Use the methods provided by the BillingProvider to manage billing entities like customers, invoices, and payment sources.

```
import { BillingComponentBindings, IService } from 'loopback4-billing';
import { inject } from '@loopback/core';
import { post, requestBody } from '@loopback/rest';
import { InvoiceDto } from '../models';

export class BillingController {
  constructor(
    @inject(BillingComponentBindings.BillingProvider)
    private readonly billingProvider: IService,
  ) {}

  @post('/billing/invoice')
  async createInvoice(
    @requestBody() invoiceDto: InvoiceDto
  ): Promise<InvoiceDto> {
    return this.billingProvider.createInvoice(invoiceDto);
  }
}

```

## Configuration
The loopback4-billing package relies on the configuration of the chosen billing provider (e.g., Chargebee). To configure the package for your application, follow the steps below.

### Step 1: Set Up Billing Provider 
#### ChargeBee -

To use Chargebee as the billing provider, you need to configure the Chargebee API keys and site URL in your application. You can set these values in the environment variables of your LoopBack 4 project.

```
CHARGEBEE_API_KEY=your_chargebee_api_key
CHARGEBEE_SITE_URL=your_chargebee_site_url
```

### Step 2: Register Billing Component
To use the billing component in your LoopBack 4 application, you need to register it in your application.ts file.

```
import { BillingComponent } from 'loopback4-billing';

export class YourApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Register Billing component
    this.component(BillingComponent);

    // Other configurations
  }
}
```
### Step 3: Use the Billing Service in Controllers or Services
You can inject the BillingProvider or IService interface into your controller or service and use the billing operations as described earlier.



## Feedback

If you've noticed a bug or have a question or have a feature request, [search the issue tracker](https://github.com/sourcefuse/loopback4-billing/issues) to see if someone else in the community has already created a ticket.
If not, go ahead and [make one](https://github.com/sourcefuse/loopback4-billing/issues/new/choose)!
All feature requests are welcome. Implementation time may vary. Feel free to contribute the same, if you can.
If you think this extension is useful, please [star](https://help.github.com/en/articles/about-stars) it. Appreciation really helps in keeping this project alive.

## Contributing

Please read [CONTRIBUTING.md](https://github.com/sourcefuse/loopback4-billing/blob/master/.github/CONTRIBUTING.md) for details on the process for submitting pull requests to us.

## Code of conduct

Code of conduct guidelines [here](https://github.com/sourcefuse/loopback4-billing/blob/master/.github/CODE_OF_CONDUCT.md).

## License

[MIT](https://github.com/sourcefuse/loopback4-billing/blob/master/LICENSE)
