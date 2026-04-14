import { IsUUID, IsNotEmpty, IsPositive, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';
import { MoneyMapper } from '../helpers/money-mapper.h';

export class CreateDto {
  @IsUUID()
  @IsNotEmpty()
  readonly transactionId: string;

  @IsUUID()
  @IsNotEmpty()
  readonly accountId: string;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  @Transform(({ value }) => MoneyMapper.toDatabase(value as number))
  readonly amount: number;
}
