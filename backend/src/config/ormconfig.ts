import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { env } from 'process';
import { AccountEntity } from '../modules/accounts/entities/account.entity';
import { LedgerEntryEntity } from '../modules/ledger/entities/ledger-entry.entity';

const DATABASE_SCHEMA_MAIN = 'main';

// Load environment variables if not already loaded
if (!env.PG_DATABASE_HOST) {
  config({ path: `src/config/.${env.NODE_ENV || 'local'}.env` });
}

export const migration = new DataSource({
  schema: DATABASE_SCHEMA_MAIN,
  type: 'postgres',
  host: env.PG_DATABASE_HOST || 'localhost',
  port: parseInt(env.PG_PORT || '5432', 10),
  username: env.PG_USERNAME || 'postgres',
  password: env.PG_PASSWORD || '',
  database: env.PG_DATABASE || 'wallet',
  entities: [AccountEntity, LedgerEntryEntity],
  migrations: ['migrations/*{.mjs,.js,.ts}'],
  synchronize: false,
});
