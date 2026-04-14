import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SortDTO } from '@common/*';
import { AccountOrderEnum } from '../enums/order.e';

export class FindAllDto extends SortDTO {
  @IsOptional()
  @IsString()
  readonly q?: string;

  @IsOptional()
  @IsEnum(AccountOrderEnum)
  readonly orderBy?: AccountOrderEnum = AccountOrderEnum.CreatedAt;
}
