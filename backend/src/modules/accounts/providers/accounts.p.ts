import { Provider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AccountRepository } from '../repository/accounts.r';
import { ACCOUNT_ENTITY, ACCOUNT_REPOSITORY, DATABASE_SOURCE } from '@common/*';
import { AccountEntity } from '../entities/account.entity';

export const accountsProvider: Provider[] = [
  {
    provide: ACCOUNT_ENTITY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(AccountEntity),
    inject: [DATABASE_SOURCE],
  },
  {
    provide: ACCOUNT_REPOSITORY,
    useFactory: (dataSource: DataSource) => new AccountRepository(dataSource),
    inject: [DATABASE_SOURCE],
  },
];
