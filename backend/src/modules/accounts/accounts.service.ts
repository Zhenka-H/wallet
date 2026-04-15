import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { AccountEntity } from './entities/account.entity';
import { CreateDto } from './dto/create.dto';
import { randomUUID, UUID } from 'crypto';
import {
  ACCOUNT_REPOSITORY,
  BaseService,
  IResCreate,
  IResItem,
  IResUpdate,
  DATABASE_SOURCE,
  METHOD_NOT_IMPLEMENTED,
  ACCOUNT_DOES_NOT_EXIST,
  ACCOUNT_CONTAINS_LEDGER_ENTRIES,
} from '@common/*';
import { AccountRepository } from './repository/accounts.r';
import { DataSource, DeleteResult } from 'typeorm';
import { LedgerEntryEntity } from '../ledger/entities/ledger-entry.entity';
import { FindAllDto } from './dto/find-all.dto';
import { MoneyMapper } from '../ledger/helpers/money-mapper.h';

@Injectable()
export class AccountsService extends BaseService<AccountEntity> {
  update(): Promise<IResUpdate<AccountEntity>> {
    throw new Error(METHOD_NOT_IMPLEMENTED);
  }
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
    @Inject(DATABASE_SOURCE)
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async findAll(
    dto: FindAllDto,
  ): Promise<{ total: number; data: AccountEntity[] }> {
    const data = await this.accountRepository.findAll(dto);
    return { total: data.total, data: data.data };
  }

  async create(dto: CreateDto): Promise<IResCreate<AccountEntity>> {
    return await this.dataSource.transaction(async (manager) => {
      const account = manager.create(AccountEntity, dto);
      const savedAccount = await manager.save(account);

      const initialEntry = manager.create(LedgerEntryEntity, {
        accountId: savedAccount.id,
        amount: MoneyMapper.toDatabase(100),
        transactionId: randomUUID(),
      });

      await manager.save(initialEntry);

      return { isSuccess: true };
    });
  }

  async findOne(id: UUID): Promise<IResItem<AccountEntity>> {
    const account = await this.accountRepository.findOneBy({ id });
    if (!account) {
      throw new BadRequestException(ACCOUNT_DOES_NOT_EXIST);
    }
    return { data: account, isSuccess: true };
  }

  async delete(id: UUID): Promise<DeleteResult> {
    const hasLedger = await this.dataSource.manager.count(LedgerEntryEntity, {
      where: { accountId: id },
    });

    if (hasLedger > 0) {
      throw new BadRequestException(ACCOUNT_CONTAINS_LEDGER_ENTRIES);
    }

    return this.accountRepository.delete(id);
  }
}
