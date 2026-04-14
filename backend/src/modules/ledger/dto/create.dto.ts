import { IsUUID, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateDto {
  @IsUUID()
  @IsNotEmpty()
  transactionId: string;

  @IsUUID()
  @IsNotEmpty()
  accountId: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;
}
