import {
  Injectable,
  BadRequestException,
  UnprocessableEntityException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { DataSource, QueryRunner, InsertResult } from 'typeorm';
import { TransferDto } from '../ledger/dto/transfer.dto';
import { LedgerEntryEntity } from '../ledger/entities/ledger-entry.entity';
import { AccountEntity } from '../accounts/entities/account.entity';
import { UUID } from 'crypto';
import { DATABASE_SOURCE } from '@common/*';
import { Decimal } from 'decimal.js';

export interface ITransferResult {
  isSuccess: boolean;
  transactionId: string;
}

@Injectable()
export class TransferService {
  constructor(
    @Inject(DATABASE_SOURCE)
    private readonly dataSource: DataSource,
  ) {}

  async transfer(dto: TransferDto): Promise<ITransferResult> {
    const { transactionId, fromAcId, toAcId, amount } = dto;

    if (fromAcId === toAcId) {
      throw new BadRequestException('Cannot transfer to the same account');
    }
    if (amount <= 0) {
      throw new BadRequestException('Transfer amount must be positive');
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const isDuplicate = await this.isDuplicateTransaction(
        queryRunner,
        transactionId,
        fromAcId,
        toAcId,
        amount,
      );
      if (isDuplicate) {
        await queryRunner.rollbackTransaction();
        return { isSuccess: true, transactionId };
      }

      await this.lockAccounts(queryRunner, [fromAcId, toAcId]);
      await this.verifySufficientFunds(queryRunner, fromAcId, amount);
      await this.executeLedgerEntries(
        queryRunner,
        transactionId,
        fromAcId,
        toAcId,
        amount,
      );

      await queryRunner.commitTransaction();
      return { isSuccess: true, transactionId };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async isDuplicateTransaction(
    queryRunner: QueryRunner,
    transactionId: UUID,
    fromAcId: UUID,
    toAcId: UUID,
    amount: number,
  ): Promise<boolean> {
    const entries = await queryRunner.manager.find(LedgerEntryEntity, {
      where: { transactionId },
    });
    if (entries.length === 0) return false;

    const debit = entries.find(
      (e) => e.accountId === fromAcId && new Decimal(e.amount).equals(-amount),
    );
    const credit = entries.find(
      (e) => e.accountId === toAcId && new Decimal(e.amount).equals(amount),
    );

    if (!debit || !credit) {
      throw new ConflictException(
        'Transaction ID already exists with different payload parameters',
      );
    }
    return true;
  }

  private async lockAccounts(
    queryRunner: QueryRunner,
    ids: UUID[],
  ): Promise<AccountEntity[]> {
    const sortedIds = [...ids].sort();
    const lockedAccounts: AccountEntity[] = [];

    for (const id of sortedIds) {
      const account = await queryRunner.manager.findOne(AccountEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!account) {
        throw new BadRequestException(`Account ${id} not found`);
      }
      lockedAccounts.push(account);
    }
    return lockedAccounts;
  }

  private async verifySufficientFunds(
    queryRunner: QueryRunner,
    accountId: UUID,
    amount: number,
  ): Promise<number> {
    const res = await queryRunner.manager
      .createQueryBuilder(LedgerEntryEntity, 'entry')
      .select('SUM(entry.amount)', 'balance')
      .where('entry.accountId = :accountId', { accountId })
      .getRawOne<{ balance: string | null }>();

    const currentBalance = new Decimal(res?.balance ?? 0);
    if (currentBalance.lessThan(amount)) {
      throw new UnprocessableEntityException('Insufficient funds');
    }
    return currentBalance.toNumber();
  }

  private async executeLedgerEntries(
    queryRunner: QueryRunner,
    txId: UUID,
    from: UUID,
    to: UUID,
    amt: number,
  ): Promise<InsertResult> {
    return await queryRunner.manager.insert(LedgerEntryEntity, [
      { transactionId: txId, accountId: from, amount: -amt },
      { transactionId: txId, accountId: to, amount: amt },
    ]);
  }
}
