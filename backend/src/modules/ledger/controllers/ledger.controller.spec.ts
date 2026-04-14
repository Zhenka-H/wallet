/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { LedgerController } from './ledger.controller';
import { LedgerService } from '../services/ledger.service';
import { randomUUID } from 'crypto';
import { CreateDto } from '../dto/create.dto';
import { IResCreate } from '@common/*';
import { LedgerEntryEntity } from '../entities/ledger-entry.entity';
import { FindAllDto as LedgerFindAllDto } from '../dto/find-all.dto';

describe('LedgerController', () => {
  let controller: LedgerController;
  let service: LedgerService;

  const mockLedgerService: jest.Mocked<Partial<LedgerService>> = {
    create: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LedgerController],
      providers: [
        {
          provide: LedgerService,
          useValue: mockLedgerService,
        },
      ],
    }).compile();

    controller = module.get<LedgerController>(LedgerController);
    service = module.get<LedgerService>(LedgerService);
  });

  describe('create', () => {
    it('should call ledgerService.create', async () => {
      const dto: CreateDto = {
        amount: 100,
        transactionId: randomUUID(),
        accountId: randomUUID(),
      };
      (mockLedgerService.create as jest.Mock).mockResolvedValue({
        isSuccess: true,
      } as IResCreate<LedgerEntryEntity>);

      const result = await controller.create(dto);

      expect(result.data).toEqual({ isSuccess: true });
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should call ledgerService.findAll', async () => {
      const mockResult = {
        total: 1,
        data: [{ id: randomUUID() } as LedgerEntryEntity],
      };
      (mockLedgerService.findAll as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.findAll({
        page: 1,
        limit: 10,
      } as unknown as LedgerFindAllDto);

      expect(result.data).toEqual(mockResult.data);
      expect(service.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      } as unknown as LedgerFindAllDto);
    });
  });
});
