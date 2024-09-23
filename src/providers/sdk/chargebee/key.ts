// Copyright (c) 2023 Sourcefuse Technologies
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import {BindingKey} from '@loopback/core';
import {ChargeBeeConfig} from './type';

export namespace ChargeBeeBindings {
  export const config = BindingKey.create<ChargeBeeConfig>(
    'sf.videochatprovider.vonage.config',
  );
}
