import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { AccountEntity } from './entities/account.entity';
import { CreateDto } from './dto/create.dto';
import { UUID } from 'crypto';
import {
  ACCOUNT_REPOSITORY,
  BaseService,
  IResCreate,
  IResItem,
  IResUpdate,
  DATABASE_SOURCE,
} from '@common/*';
import { AccountRepository } from './repository/accounts.r';
import { DataSource, DeleteResult } from 'typeorm';
import { LedgerEntryEntity } from '../ledger/entities/ledger-entry.entity';
import { FindAllDto } from './dto/find-all.dto';
import { LedgerService } from '../services/ledger.service';

@Injectable()
export class AccountsService extends BaseService<AccountEntity> {
  update(): Promise<IResUpdate<AccountEntity>> {
    throw new Error('Method not implemented.');
  }
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
    @Inject(DATABASE_SOURCE)
    private readonly dataSource: DataSource,
    private readonly ledgerService: LedgerService,
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
    const account = this.accountRepository.create(dto);
    const savedAccount = await this.accountRepository.save(account);

    await this.ledgerService.create({
      accountId: savedAccount.id,
      amount: 100,
      transactionId: savedAccount.id,
    });

    return { isSuccess: true };
  }

  async findOne(id: UUID): Promise<IResItem<AccountEntity>> {
    const account = await this.accountRepository.findOneBy({ id });
    if (!account) {
      throw new BadRequestException('Account does not exist');
    }
    return { data: account, isSuccess: true };
  }

  async delete(id: UUID): Promise<DeleteResult> {
    const hasLedger = await this.dataSource.manager.count(LedgerEntryEntity, {
      where: { accountId: id },
    });

    if (hasLedger > 0) {
      throw new BadRequestException(
        'Account contains ledger entries and cannot be deleted',
      );
    }

    return this.accountRepository.delete(id);
  }
}
