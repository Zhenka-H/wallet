import { IsUUID, IsPositive, IsNotEmpty, IsNumber } from 'class-validator';
import { UUID } from 'crypto';

export class TransferDto {
  @IsUUID()
  @IsNotEmpty()
  transactionId: UUID;

  @IsUUID()
  @IsNotEmpty()
  fromAcId: UUID;

  @IsUUID()
  @IsNotEmpty()
  toAcId: UUID;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Amount cannot have more than 2 decimal places' },
  )
  @IsPositive()
  @IsNotEmpty()
  amount: number;
}
