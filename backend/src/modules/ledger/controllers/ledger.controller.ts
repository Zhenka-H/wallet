import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { LedgerService } from '../../services/ledger.service';
import { CreateDto } from '../dto/create.dto';
import { UUID } from 'crypto';
import { Response } from '@common/*';
import { FindAllDto } from '../dto/find-all.dto';

@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Post()
  async create(@Body() dto: CreateDto) {
    const res = await this.ledgerService.create(dto);
    return Response.returnData(res);
  }

  @Get()
  async findAll(@Query() dto: FindAllDto) {
    const res = await this.ledgerService.findAll(dto);
    return Response.returnData(res.data, {
      total: res.total,
      page: dto.page,
      limit: dto.limit,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: UUID) {
    const res = await this.ledgerService.findOne(id);
    return Response.returnData(res.data);
  }

  @Get('account/:accountId')
  async findByAccount(@Param('accountId') accountId: UUID) {
    const res = await this.ledgerService.findByAccount(accountId);
    return Response.returnData(res.data);
  }
}
