import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { LedgerEntryEntity } from '../ledger/entities/ledger-entry.entity';
import { CreateDto } from '../ledger/dto/create.dto';
import {
  BaseService,
  IResCreate,
  IResItem,
  IResUpdate,
  LEDGER_ENTRY_REPOSITORY,
  DATABASE_SOURCE,
} from '@common/*';
import { LedgerEntryRepository } from '../ledger/repository/ledger-entry.r';
import { UUID } from 'crypto';
import { DataSource } from 'typeorm';
import { Decimal } from 'decimal.js';
import { AccountEntity } from '../accounts/entities/account.entity';
import { FindAllDto } from '../ledger/dto/find-all.dto';

@Injectable()
export class LedgerService extends BaseService<LedgerEntryEntity> {
  update(): Promise<IResUpdate<LedgerEntryEntity>> {
    throw new Error('Method not implemented.');
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
      throw new BadRequestException('Ledger Entry does not exist');
    }
    return { data: ledgerEntry, isSuccess: true };
  }

  async create(dto: CreateDto): Promise<IResCreate<LedgerEntryEntity>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const account = await queryRunner.manager.findOne(AccountEntity, {
        where: { id: dto.accountId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!account) {
        throw new BadRequestException('Account does not exist');
      }

      const entry = queryRunner.manager.create(LedgerEntryEntity, dto);
      await queryRunner.manager.save(LedgerEntryEntity, entry);

      await queryRunner.commitTransaction();
      return { isSuccess: true };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findByAccount(accountId: UUID): Promise<IResItem<LedgerEntryEntity[]>> {
    const ledger = await this.ledgerEntryRepository.find({
      where: { accountId },
      order: { timestamp: 'DESC' },
    });

    if (!ledger) {
      throw new BadRequestException('Ledger does not exist');
    }
    return { data: ledger, isSuccess: true };
  }

  async getBalance(accountId: UUID): Promise<{ balance: number }> {
    const res = await this.dataSource.manager
      .createQueryBuilder(LedgerEntryEntity, 'entry')
      .select('SUM(entry.amount)', 'balance')
      .where('entry.accountId = :id', { id: accountId })
      .getRawOne<{ balance: string | null }>();

    return { balance: new Decimal(res?.balance ?? 0).toNumber() };
  }
}
