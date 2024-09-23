import {Provider, inject} from '@loopback/core';
import {ChargeBeeService} from './charge-bee.service';
import {ChargeBeeBindings} from './key';
import {IChargeBeeService, ChargeBeeConfig} from './type';

export class ChargeBeeServiceProvider implements Provider<IChargeBeeService> {
  constructor(
    @inject(ChargeBeeBindings.config, {optional: true})
    private readonly chargeBeeConfig: ChargeBeeConfig,
  ) {}

  value(): IChargeBeeService {
    return new ChargeBeeService(this.chargeBeeConfig);
  }
}
