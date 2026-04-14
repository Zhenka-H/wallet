import { Controller, Post, Body } from '@nestjs/common';
import { TransferDto } from '../dto/transfer.dto';
import { ITransferResult, TransferService } from '../services/transfer.service';

@Controller('transfers')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post()
  async execute(@Body() dto: TransferDto): Promise<ITransferResult> {
    return this.transferService.transfer(dto);
  }
}
