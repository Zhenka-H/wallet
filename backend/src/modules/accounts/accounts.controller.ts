import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { LedgerService } from '../ledger/services/ledger.service';
import { CreateDto } from './dto/create.dto';
import { UUID } from 'crypto';
import { Response } from '@common/*';
import { FindAllDto } from './dto/find-all.dto';

@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly ledgerService: LedgerService,
  ) {}

  @Get()
  async findAll(@Query() dto: FindAllDto) {
    const res = await this.accountsService.findAll(dto);
    return Response.returnData(res.data, {
      total: res.total,
      page: dto.page,
      limit: dto.limit,
    });
  }

  @Post()
  async create(@Body() dto: CreateDto) {
    const res = await this.accountsService.create(dto);
    return Response.returnData(res);
  }

  @Get(':id')
  async findOne(@Param('id') id: UUID) {
    const res = await this.accountsService.findOne(id);
    return Response.returnData(res.data);
  }

  @Get(':id/balance')
  async getBalance(@Param('id') id: UUID) {
    const res = await this.ledgerService.getBalance(id);
    return Response.returnData(res);
  }

  @Get(':id/transactions')
  async getTransactions(@Param('id') id: UUID) {
    const res = await this.ledgerService.findByAccount(id);
    return Response.returnData(res.data);
  }

  @Delete(':id')
  async delete(@Param('id') id: UUID) {
    await this.accountsService.delete(id);
  }
}
