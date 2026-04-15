import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { LedgerService } from '../ledger/services/ledger.service';
import { CreateDto } from './dto/create.dto';
import { UUID } from 'crypto';
import { Response } from '@common/*';
import { FindAllDto as AccountFindAllDto } from './dto/find-all.dto';
import { FindAllDto as LedgerFindAllDto } from '../ledger/dto/find-all.dto';

@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly ledgerService: LedgerService,
  ) {}

  @Get()
  async findAll(@Query() dto: AccountFindAllDto) {
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
  async findOne(@Param('id', ParseUUIDPipe) id: UUID) {
    const res = await this.accountsService.findOne(id);
    return Response.returnData(res.data);
  }

  @Get(':id/balance')
  async getBalance(@Param('id', ParseUUIDPipe) id: UUID) {
    const res = await this.ledgerService.getBalance(id);
    return Response.returnData(res);
  }

  @Get(':id/transactions')
  async getTransactions(
    @Param('id', ParseUUIDPipe) id: UUID,
    @Query() dto: LedgerFindAllDto,
  ) {
    dto.accountId = id;
    const res = await this.ledgerService.findAll(dto);

    return Response.returnData(res.data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: UUID) {
    await this.accountsService.delete(id);
  }
}
