/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { TransferService } from './transfer.service';
import { DataSource, QueryRunner, SelectQueryBuilder } from 'typeorm';
import { DATABASE_SOURCE } from '@common/*';
import {
  BadRequestException,
  UnprocessableEntityException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TransferDto } from '../ledger/dto/transfer.dto';

describe('TransferService', () => {
  let service: TransferService;
  let queryRunner: QueryRunner;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  } as unknown as jest.Mocked<SelectQueryBuilder<Record<string, unknown>>>;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      count: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      insert: jest.fn(),
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
    },
  } as unknown as jest.Mocked<QueryRunner>;

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  } as unknown as jest.Mocked<DataSource>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        {
          provide: DATABASE_SOURCE,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TransferService>(TransferService);
    queryRunner = mockQueryRunner;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('transfer', () => {
    const fromAcId = randomUUID();
    const toAcId = randomUUID();
    const transactionId = randomUUID();
    const transferDto: TransferDto = {
      transactionId,
      fromAcId,
      toAcId,
      amount: 100,
    };

    it('should throw BadRequestException if fromAcId and toAcId are the same', async () => {
      const selfTransferDto: TransferDto = {
        ...transferDto,
        toAcId: fromAcId,
      };

      await expect(service.transfer(selfTransferDto)).rejects.toThrow(
        new BadRequestException('Cannot transfer to the same account'),
      );
    });

    it('should throw BadRequestException if amount is zero or negative', async () => {
      const zeroAmountDto: TransferDto = {
        ...transferDto,
        amount: 0,
      };

      await expect(service.transfer(zeroAmountDto)).rejects.toThrow(
        new BadRequestException('Transfer amount must be positive'),
      );
    });

    it('should return success immediately if transaction is a duplicate', async () => {
      (queryRunner.manager.find as jest.Mock).mockResolvedValue([
        { accountId: fromAcId, amount: -100 },
        { accountId: toAcId, amount: 100 },
      ]);

      const result = await service.transfer(transferDto);

      expect(result).toEqual({ isSuccess: true, transactionId });
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should throw ConflictException if transaction is a duplicate but details differ (amount)', async () => {
      (queryRunner.manager.find as jest.Mock).mockResolvedValue([
        { accountId: fromAcId, amount: -500 }, // Different amount
        { accountId: toAcId, amount: 500 },
      ]);

      await expect(service.transfer(transferDto)).rejects.toThrow(
        ConflictException,
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if transaction is a duplicate but details differ (account)', async () => {
      (queryRunner.manager.find as jest.Mock).mockResolvedValue([
        { accountId: fromAcId, amount: -100 },
        { accountId: randomUUID(), amount: 100 }, // Different account
      ]);

      await expect(service.transfer(transferDto)).rejects.toThrow(
        ConflictException,
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if account is not found', async () => {
      (queryRunner.manager.find as jest.Mock).mockResolvedValue([]);
      (queryRunner.manager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.transfer(transferDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw UnprocessableEntityException if funds are insufficient', async () => {
      (queryRunner.manager.find as jest.Mock).mockResolvedValue([]);
      // Mock account lock success
      (queryRunner.manager.findOne as jest.Mock).mockResolvedValue({
        id: fromAcId,
      });

      (mockQueryBuilder.getRawOne as jest.Mock).mockResolvedValue({
        balance: '50',
      });

      await expect(service.transfer(transferDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should successfully commit transfer when all conditions are met', async () => {
      (queryRunner.manager.find as jest.Mock).mockResolvedValue([]);
      (queryRunner.manager.findOne as jest.Mock).mockResolvedValue({
        id: fromAcId,
      });

      (mockQueryBuilder.getRawOne as jest.Mock).mockResolvedValue({
        balance: '200',
      });

      const result = await service.transfer(transferDto);

      expect(result).toEqual({ isSuccess: true, transactionId });
      expect(queryRunner.manager.insert).toHaveBeenCalledTimes(1);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});
