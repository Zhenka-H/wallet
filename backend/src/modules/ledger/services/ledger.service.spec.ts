/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { LedgerService } from './ledger.service';
import {
  LEDGER_ENTRY_REPOSITORY,
  DATABASE_SOURCE,
  IResCreate,
} from '@common/*';
import { LedgerEntryEntity } from '../entities/ledger-entry.entity';
import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { CreateDto } from '../dto/create.dto';
import { LedgerEntryRepository } from '../repository/ledger-entry.r';
import { FindAllDto } from '../dto/find-all.dto';

describe('LedgerService', () => {
  let service: LedgerService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findAll: jest.fn(),
  } as unknown as jest.Mocked<LedgerEntryRepository>;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    },
  };

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  } as unknown as jest.Mocked<SelectQueryBuilder<LedgerEntryEntity>>;

  const mockDataSource = {
    manager: {
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
    },
    createQueryRunner: jest.fn(() => mockQueryRunner),
  } as unknown as jest.Mocked<DataSource>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LedgerService,
        {
          provide: LEDGER_ENTRY_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: DATABASE_SOURCE,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<LedgerService>(LedgerService);
  });

  describe('create', () => {
    it('should create and save a ledger entry', async () => {
      const dto: CreateDto = {
        amount: 100,
        transactionId: randomUUID(),
        accountId: randomUUID(),
      };
      mockQueryRunner.manager.findOne.mockResolvedValue({
        id: dto.accountId,
      });
      mockQueryRunner.manager.create.mockReturnValue(dto);
      mockQueryRunner.manager.save.mockResolvedValue({
        id: '1',
        ...dto,
      });

      const result: IResCreate<LedgerEntryEntity> = await service.create(dto);

      expect(result).toEqual({ isSuccess: true });
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        LedgerEntryEntity,
        dto,
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if account is not found during locking', async () => {
      const dto: CreateDto = {
        amount: 100,
        transactionId: randomUUID(),
        accountId: randomUUID(),
      };
      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(
        new BadRequestException('Account does not exist'),
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all ledger entries', async () => {
      const mockResult = {
        total: 1,
        data: [{ id: '1', amount: 100 } as unknown as LedgerEntryEntity],
      };
      mockRepository.findAll.mockResolvedValue(mockResult);

      const result = await service.findAll({} as unknown as FindAllDto);

      expect(result).toEqual(mockResult);
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        {} as unknown as FindAllDto,
      );
    });

    it('should filter by accountId', async () => {
      const accountId = randomUUID();
      const mockResult = {
        total: 1,
        data: [
          { id: '1', amount: 100, accountId } as unknown as LedgerEntryEntity,
        ],
      };
      mockRepository.findAll.mockResolvedValue(mockResult);

      const result = await service.findAll({
        accountId,
        page: 1,
        limit: 10,
        skip: 0,
      } as unknown as FindAllDto);

      expect(result).toEqual(mockResult);
      expect(mockRepository.findAll).toHaveBeenCalledWith({
        accountId,
        page: 1,
        limit: 10,
        skip: 0,
      } as unknown as FindAllDto);
    });
  });

  describe('getBalance', () => {
    it('should return the balance for an account', async () => {
      const accountId = randomUUID();
      (mockQueryBuilder.getRawOne as jest.Mock).mockResolvedValue({
        balance: '15050',
      });

      const result: { balance: number } = await service.getBalance(accountId);

      expect(result).toEqual({ balance: 150.5 });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'entry.accountId = :id',
        { id: accountId },
      );
    });
    it('should return 0 balance if no entries found', async () => {
      (mockQueryBuilder.getRawOne as jest.Mock).mockResolvedValue(null);

      const result: { balance: number } =
        await service.getBalance(randomUUID());
      expect(result).toEqual({ balance: 0 });
    });

    it('should return the correct balance with high precision decimals', async () => {
      (mockQueryBuilder.getRawOne as jest.Mock).mockResolvedValue({
        balance: '12345.6789',
      });
      const result = await service.getBalance(randomUUID());
      expect(result.balance).toBe(123.456789);
    });
  });
});
