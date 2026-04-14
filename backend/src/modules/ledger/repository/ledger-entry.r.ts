import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { LedgerEntryEntity } from '../entities/ledger-entry.entity';
import { isUUID } from 'class-validator';
import { OrderEnum } from '@common/*';
import { LedgersOrderEnum } from '../enums/order.e';
import { FindAllDto } from '../dto/find-all.dto';

@Injectable()
export class LedgerEntryRepository extends Repository<LedgerEntryEntity> {
  constructor(private dataSource: DataSource) {
    super(LedgerEntryEntity, dataSource.manager);
  }

  async findAll(
    dto: FindAllDto,
  ): Promise<{ total: number; data: LedgerEntryEntity[] }> {
    const order: { [key in LedgersOrderEnum]: string } = {
      [LedgersOrderEnum.Id]: 'ledger_entries.id',
      [LedgersOrderEnum.Amount]: 'ledger_entries.amount',
      [LedgersOrderEnum.AccountId]: 'ledger_entries.accountId',
      [LedgersOrderEnum.TransactionId]: 'ledger_entries.transactionId',
      [LedgersOrderEnum.CreatedAt]: 'ledger_entries.timestamp',
    };

    const { q, limit, accountId } = dto;
    const qb = this.createQueryBuilder('ledger_entries');

    if (accountId) {
      qb.andWhere(`ledger_entries.accountId = :accountId`, { accountId });
    }

    if (q) {
      if (isUUID(q)) {
        qb.andWhere(
          `(ledger_entries.id = :q::uuid OR ledger_entries.accountId = :q::uuid OR ledger_entries.transactionId = :q::uuid)`,
          { q },
        );
      } else {
        qb.andWhere(`(ledger_entries.amount ILIKE '%' || :q || '%')`, { q });
      }
    }

    const column =
      order[dto.orderBy as keyof typeof order] ||
      order[LedgersOrderEnum.CreatedAt];

    qb.orderBy(column, dto.order === OrderEnum.Desc ? 'DESC' : 'ASC');

    qb.offset(dto.skip).limit(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total };
  }
}
