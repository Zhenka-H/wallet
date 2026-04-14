import { Provider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AccountRepository } from '../repository/accounts.r';
import { ACCOUNT_REPOSITORY, DATABASE_SOURCE } from '@common/*';

export const accountsProvider: Provider[] = [
  {
    provide: ACCOUNT_REPOSITORY,
    useFactory: (dataSource: DataSource) => new AccountRepository(dataSource),
    inject: [DATABASE_SOURCE],
  },
];
