import { IsUUID, IsPositive, IsNotEmpty, IsInt } from 'class-validator';
import { UUID } from 'crypto';
import { Transform } from 'class-transformer';
import { MoneyMapper } from '../helpers/money-mapper.h';

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

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  @Transform(({ value }) => MoneyMapper.toDatabase(value as number))
  amount: number;
}
