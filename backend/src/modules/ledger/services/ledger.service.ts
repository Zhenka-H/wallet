import {
  Injectable,
  BadRequestException,
  Inject,
  UnprocessableEntityException,
} from '@nestjs/common';
import { LedgerEntryEntity } from '../entities/ledger-entry.entity';
import { CreateDto } from '../dto/create.dto';
import {
  BaseService,
  IResCreate,
  IResItem,
  IResUpdate,
  LEDGER_ENTRY_REPOSITORY,
  DATABASE_SOURCE,
  METHOD_NOT_IMPLEMENTED,
  LEDGER_ENTRY_DOES_NOT_EXIST,
  ACCOUNT_DOES_NOT_EXIST,
} from '@common/*';
import { LedgerEntryRepository } from '../repository/ledger-entry.r';
import { UUID } from 'crypto';
import { DataSource, EntityManager } from 'typeorm';
import { Decimal } from 'decimal.js';
import { AccountEntity } from '../../accounts/entities/account.entity';
import { FindAllDto } from '../dto/find-all.dto';
import { MoneyMapper } from '../helpers/money-mapper.h';

@Injectable()
export class LedgerService extends BaseService<LedgerEntryEntity> {
  update(): Promise<IResUpdate<LedgerEntryEntity>> {
    throw new Error(METHOD_NOT_IMPLEMENTED);
  }
  constructor(
    @Inject(LEDGER_ENTRY_REPOSITORY)
    private readonly ledgerEntryRepository: LedgerEntryRepository,
    @Inject(DATABASE_SOURCE)
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async findAll(
    dto: FindAllDto,
  ): Promise<{ total: number; data: LedgerEntryEntity[] }> {
    const data = await this.ledgerEntryRepository.findAll(dto);
    return { total: data.total, data: data.data };
  }

  async findOne(id: UUID): Promise<IResItem<LedgerEntryEntity>> {
    const ledgerEntry = await this.ledgerEntryRepository.findOneBy({ id });
    if (!ledgerEntry) {
      throw new BadRequestException(LEDGER_ENTRY_DOES_NOT_EXIST);
    }
    return { data: ledgerEntry, isSuccess: true };
  }

  async create(dto: CreateDto): Promise<IResCreate<LedgerEntryEntity>> {
    return await this.dataSource.transaction(async (manager) => {
      const account = await manager.findOne(AccountEntity, {
        where: { id: dto.accountId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!account) {
        throw new BadRequestException(ACCOUNT_DOES_NOT_EXIST);
      }

      if (dto.amount < 0) {
        await this.verifySufficientFunds(
          manager,
          dto.accountId,
          Math.abs(dto.amount),
        );
      }

      await this.createEntry(manager, dto);

      return { isSuccess: true };
    });
  }

  async createEntry(
    manager: EntityManager,
    dto: { transactionId: string; accountId: string; amount: number },
  ): Promise<LedgerEntryEntity> {
    const entry = manager.create(LedgerEntryEntity, {
      ...dto,
      amount: MoneyMapper.toDatabase(dto.amount),
    });
    return await manager.save(LedgerEntryEntity, entry);
  }

  async verifySufficientFunds(
    manager: EntityManager,
    accountId: string,
    amount: number,
  ): Promise<void> {
    const res = await manager
      .createQueryBuilder(LedgerEntryEntity, 'entry')
      .select('SUM(entry.amount)', 'balance')
      .where('entry.accountId = :id', { id: accountId })
      .getRawOne<{ balance: string | null }>();

    const currentBalance = new Decimal(res?.balance ?? 0);
    if (currentBalance.lessThan(amount)) {
      throw new UnprocessableEntityException('INSUFFICIENT_FUNDS');
    }
  }

  async getBalance(accountId: UUID): Promise<{ balance: number }> {
    const res = await this.dataSource.manager
      .createQueryBuilder(LedgerEntryEntity, 'entry')
      .select('SUM(entry.amount)', 'balance')
      .where('entry.accountId = :id', { id: accountId })
      .getRawOne<{ balance: string | null }>();

    return {
      balance: MoneyMapper.toFrontend(
        new Decimal(res?.balance ?? 0).toNumber(),
      ),
    };
  }
}
