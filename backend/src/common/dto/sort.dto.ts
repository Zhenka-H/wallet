import { OrderEnum } from '../enums';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export abstract class SortDTO extends PaginationDto {
  @IsOptional()
  @IsEnum(OrderEnum)
  readonly order?: OrderEnum = OrderEnum.Desc;

  abstract readonly orderBy?: string;
}
