import { Module } from '@nestjs/common';
import { LedgerController } from './controllers/ledger.controller';
import { TransferController } from './controllers/transfer.controller';
import { LedgerService } from './services/ledger.service';
import { ledgerProvider } from './providers/ledger.p';
import { TransferService } from './services/transfer.service';

@Module({
  imports: [],
  providers: [LedgerService, TransferService, ...ledgerProvider],
  controllers: [LedgerController, TransferController],
  exports: [LedgerService],
})
export class LedgerModule {}
