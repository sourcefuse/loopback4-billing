# billing

[![LoopBack](https://github.com/loopbackio/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png)](http://loopback.io/)

## Installation

Install BillingComponent using `npm`;

```sh
$ [npm install | yarn add] billing
```

## Basic Use

Configure and load BillingComponent in the application constructor
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
