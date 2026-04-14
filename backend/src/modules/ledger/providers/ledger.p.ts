import { Provider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LedgerEntryRepository } from '../repository/ledger-entry.r';
import { DATABASE_SOURCE, LEDGER_ENTRY_REPOSITORY } from '@common/*';

export const ledgerProvider: Provider[] = [
  {
    provide: LEDGER_ENTRY_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      new LedgerEntryRepository(dataSource),
    inject: [DATABASE_SOURCE],
  },
];
