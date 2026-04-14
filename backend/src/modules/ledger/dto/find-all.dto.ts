import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SortDTO } from '@common/*';
import { LedgersOrderEnum } from '../enums/order.e';

export class FindAllDto extends SortDTO {
  @IsOptional()
  @IsString()
  readonly q?: string;

  @IsOptional()
  @IsEnum(LedgersOrderEnum)
  readonly orderBy?: LedgersOrderEnum = LedgersOrderEnum.CreatedAt;
}
