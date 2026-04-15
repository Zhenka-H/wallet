import { Decimal } from 'decimal.js';
import { BadRequestException } from '@nestjs/common';
import { AMOUNT_EXCEEDS_MAX_DECIMALS } from '@common/*';

export class MoneyMapper {
  static toDatabase(amount: number): number {
    if (Number.isNaN(amount)) {
      return 0;
    }

    const decimalAmount = new Decimal(amount);

    if (decimalAmount.decimalPlaces() > 2) {
      throw new BadRequestException(AMOUNT_EXCEEDS_MAX_DECIMALS);
    }

    return decimalAmount.times(100).toNumber();
  }

  static toFrontend(amountInCents: number): number {
    if (Number.isNaN(amountInCents)) {
      return 0;
    }
    return new Decimal(amountInCents).dividedBy(100).toNumber();
  }
}
