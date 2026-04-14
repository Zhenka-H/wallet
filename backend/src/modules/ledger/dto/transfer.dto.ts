import { IsUUID, IsNumber, IsPositive, IsNotEmpty } from 'class-validator';
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

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;
}
