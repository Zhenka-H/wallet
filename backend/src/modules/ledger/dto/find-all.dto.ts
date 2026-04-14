import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { SortDTO } from '@common/*';
import { LedgersOrderEnum } from '../enums/order.e';
import { UUID } from 'crypto';

export class FindAllDto extends SortDTO {
  @IsOptional()
  @IsUUID()
  accountId?: UUID;

  @IsOptional()
  @IsString()
  readonly q?: string;

  @IsOptional()
  @IsEnum(LedgersOrderEnum)
  readonly orderBy?: LedgersOrderEnum = LedgersOrderEnum.CreatedAt;
}
