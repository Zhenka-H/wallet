import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './adapter/database/database.module';
import { LoggerService } from './logger/logger.s';
import { AccountsModule } from './modules/accounts/accounts.module';
import { LedgerModule } from './modules/ledger/ledger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `./src/config/.${process.env.NODE_ENV || 'local'}.env`,
      isGlobal: true,
    }),
    DatabaseModule,
    AccountsModule,
    LedgerModule,
  ],
  controllers: [AppController],
  providers: [AppService, LoggerService],
})
export class AppModule {}
