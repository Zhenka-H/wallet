import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { AccountEntity } from '../entities/account.entity';
import { FindAllDto } from '../dto/find-all.dto';
import { AccountOrderEnum } from '../enums/order.e';
import { isUUID } from 'class-validator';
import { OrderEnum } from '@common/*';

@Injectable()
export class AccountRepository extends Repository<AccountEntity> {
  constructor(private dataSource: DataSource) {
    super(AccountEntity, dataSource.manager);
  }

  async findAll(
    dto: FindAllDto,
  ): Promise<{ total: number; data: AccountEntity[] }> {
    const order: { [key in AccountOrderEnum]: string } = {
      [AccountOrderEnum.Id]: `accounts.${AccountOrderEnum.Id}`,
      [AccountOrderEnum.Name]: `accounts.${AccountOrderEnum.Name}`,
      [AccountOrderEnum.CreatedAt]: `accounts.${AccountOrderEnum.CreatedAt}`,
    };

    const { q, limit } = dto;
    const qb = this.createQueryBuilder('accounts');

    if (q) {
      if (isUUID(q)) {
        qb.andWhere(`(accounts.id = :q::uuid)`, { q });
      } else {
        qb.andWhere(`(accounts.name ILIKE '%' || :q || '%')`, { q });
      }
    }

    const column =
      order[dto.orderBy as keyof typeof order] ||
      order[AccountOrderEnum.CreatedAt];

    qb.orderBy(column, dto.order === OrderEnum.Desc ? 'DESC' : 'ASC');

    qb.offset(dto.skip).limit(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total };
  }
}
