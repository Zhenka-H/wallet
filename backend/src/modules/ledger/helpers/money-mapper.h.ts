import { Decimal } from 'decimal.js';

export class MoneyMapper {
  static toDatabase(amount: number): number {
    if (Number.isNaN(amount)) {
      return 0;
    }

    return Math.round(new Decimal(amount).times(100).toNumber());
  }
  static toFrontend(amountInCents: number): number {
    if (Number.isNaN(amountInCents)) {
      return 0;
    }
    return new Decimal(amountInCents).dividedBy(100).toNumber();
  }
}
