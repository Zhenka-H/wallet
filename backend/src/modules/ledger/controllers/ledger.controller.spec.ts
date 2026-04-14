/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { LedgerController } from './ledger.controller';
import { LedgerService } from '../services/ledger.service';
import { randomUUID } from 'crypto';
import { CreateDto } from '../dto/create.dto';
import { IResCreate, IResItem } from '@common/*';
import { LedgerEntryEntity } from '../entities/ledger-entry.entity';

describe('LedgerController', () => {
  let controller: LedgerController;
  let service: LedgerService;

  const mockLedgerService: jest.Mocked<Partial<LedgerService>> = {
    create: jest.fn(),
    findByAccount: jest.fn(),
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

  describe('findByAccount', () => {
    it('should call ledgerService.findByAccount', async () => {
      const accountId = randomUUID();
      const mockData = [{ id: randomUUID() }] as LedgerEntryEntity[];
      (mockLedgerService.findByAccount as jest.Mock).mockResolvedValue({
        data: mockData,
        isSuccess: true,
      } as IResItem<LedgerEntryEntity[]>);

      const result = await controller.findByAccount(accountId);

      expect(result.data).toEqual(mockData);
      expect(service.findByAccount).toHaveBeenCalledWith(accountId);
    });
  });
});
