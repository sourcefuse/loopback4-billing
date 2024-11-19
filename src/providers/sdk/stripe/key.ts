// Copyright (c) 2023 Sourcefuse Technologies
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import {BindingKey} from '@loopback/core';
import {StripeConfig} from './type';

export namespace StripeBindings {
  export const config = BindingKey.create<StripeConfig>(
    'sf.provider.stripe.config',
  );
}
