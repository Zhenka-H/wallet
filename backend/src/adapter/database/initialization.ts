import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { DATABASE_SOURCE } from '@common/*';
import { AccountEntity } from '../../modules/accounts/entities/account.entity';
import { LedgerEntryEntity } from '../../modules/ledger/entities/ledger-entry.entity';

const DATABASE_SCHEMA_MAIN = 'main';
const logger = new Logger('DatabaseModule');

export const databaseProviders = [
  {
    provide: DATABASE_SOURCE,
    useFactory: async (configService: ConfigService) => {
      const dataSource = new DataSource({
        type: 'postgres',
        schema: DATABASE_SCHEMA_MAIN,
        host: configService.get<string>('PG_DATABASE_HOST', 'localhost'),
        port: configService.get<number>('PG_PORT', 5432),
        username: configService.get<string>('PG_USERNAME', 'postgres'),
        password: configService.get<string>('PG_PASSWORD'),
        database: configService.get<string>('PG_DATABASE'),
        entities: [AccountEntity, LedgerEntryEntity],
        logging: false,
        synchronize: false,
      });

      try {
        const connection = await dataSource.initialize();
        logger.log(
          `Database connection established: ${configService.get<string>('PG_DATABASE')}@${configService.get<string>('PG_DATABASE_HOST')}:${configService.get<number>('PG_PORT')}`,
        );
        return connection;
      } catch (error) {
        logger.error('Failed to connect to database', error);
        throw error;
      }
    },
    inject: [ConfigService],
  },
];
