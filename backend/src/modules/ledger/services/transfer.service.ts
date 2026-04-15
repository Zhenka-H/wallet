import {
  Injectable,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import { TransferDto } from '../dto/transfer.dto';
import { LedgerEntryEntity } from '../entities/ledger-entry.entity';
import { AccountEntity } from '../../accounts/entities/account.entity';
import { UUID } from 'crypto';
import {
  DATABASE_SOURCE,
  CANNOT_TRANSFER_TO_SAME_ACCOUNT,
  TRANSFER_AMOUNT_MUST_BE_POSITIVE,
  TRANSACTION_ID_ALREADY_EXISTS,
  ACCOUNT_ID_NOT_FOUND,
} from '@common/*';
import { LedgerService } from './ledger.service';

export interface ITransferResult {
  isSuccess: boolean;
  transactionId: string;
}

@Injectable()
export class TransferService {
  constructor(
    @Inject(DATABASE_SOURCE)
    private readonly dataSource: DataSource,
    private readonly ledgerService: LedgerService,
  ) {}

  async transfer(dto: TransferDto): Promise<ITransferResult> {
    const { transactionId, fromAcId, toAcId, amount } = dto;

    if (fromAcId === toAcId) {
      throw new BadRequestException(CANNOT_TRANSFER_TO_SAME_ACCOUNT);
    }
    if (amount <= 0) {
      throw new BadRequestException(TRANSFER_AMOUNT_MUST_BE_POSITIVE);
    }

    return await this.dataSource.transaction(async (manager) => {
      const isDuplicate = await this.isDuplicateTransaction(
        manager,
        transactionId,
        fromAcId,
        toAcId,
        amount,
      );
      if (isDuplicate) {
        return { isSuccess: true, transactionId };
      }

      await this.lockAccounts(manager, [fromAcId, toAcId]);
      await this.ledgerService.verifySufficientFunds(manager, fromAcId, amount);
      await this.executeLedgerEntries(
        manager,
        transactionId,
        fromAcId,
        toAcId,
        amount,
      );

      return { isSuccess: true, transactionId };
    });
  }

  private async isDuplicateTransaction(
    manager: EntityManager,
    transactionId: UUID,
    fromAcId: UUID,
    toAcId: UUID,
    amount: number,
  ): Promise<boolean> {
    const entries = await manager.find(LedgerEntryEntity, {
      where: { transactionId },
    });
    if (entries.length === 0) return false;

    const debit = entries.find(
      (e) => e.accountId === fromAcId && e.amount === -amount,
    );
    const credit = entries.find(
      (e) => e.accountId === toAcId && e.amount === amount,
    );

    if (!debit || !credit) {
      throw new ConflictException(TRANSACTION_ID_ALREADY_EXISTS);
    }
    return true;
  }

  private async lockAccounts(
    manager: EntityManager,
    ids: UUID[],
  ): Promise<AccountEntity[]> {
    const sortedIds = [...ids].sort();
    const accounts = await manager.find(AccountEntity, {
      where: { id: In(sortedIds) },
      lock: { mode: 'pessimistic_write' },
    });

    if (accounts.length !== ids.length) {
      throw new BadRequestException(ACCOUNT_ID_NOT_FOUND);
    }

    return accounts;
  }

  private async executeLedgerEntries(
    manager: EntityManager,
    txId: string,
    from: string,
    to: string,
    amt: number,
  ): Promise<void> {
    await this.ledgerService.createEntry(manager, {
      transactionId: txId,
      accountId: from,
      amount: -amt,
    });
    await this.ledgerService.createEntry(manager, {
      transactionId: txId,
      accountId: to,
      amount: amt,
    });
  }
}
