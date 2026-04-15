import { Test, TestingModule } from '@nestjs/testing';
import { TransferService } from './transfer.service';
import {
  DataSource,
  EntityManager,
  QueryRunner,
  SelectQueryBuilder,
} from 'typeorm';
import {
  DATABASE_SOURCE,
  CANNOT_TRANSFER_TO_SAME_ACCOUNT,
  TRANSFER_AMOUNT_MUST_BE_POSITIVE,
  TRANSACTION_ID_ALREADY_EXISTS,
  ACCOUNT_ID_NOT_FOUND,
} from '@common/*';
import {
  BadRequestException,
  UnprocessableEntityException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TransferDto } from '../dto/transfer.dto';
import { LedgerService } from './ledger.service';

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

  const mockLedgerService = {
    verifySufficientFunds: jest.fn(),
    createEntry: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
    transaction: jest.fn((cb: (manager: EntityManager) => Promise<unknown>) =>
      cb(mockQueryRunner.manager as unknown as EntityManager),
    ),
  } as unknown as jest.Mocked<DataSource>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        {
          provide: DATABASE_SOURCE,
          useValue: mockDataSource,
        },
        {
          provide: LedgerService,
          useValue: mockLedgerService,
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
        new BadRequestException(CANNOT_TRANSFER_TO_SAME_ACCOUNT),
      );
    });

    it('should throw BadRequestException if amount is zero or negative', async () => {
      const zeroAmountDto: TransferDto = {
        ...transferDto,
        amount: 0,
      };

      await expect(service.transfer(zeroAmountDto)).rejects.toThrow(
        new BadRequestException(TRANSFER_AMOUNT_MUST_BE_POSITIVE),
      );
    });

    it('should return success immediately if transaction is a duplicate', async () => {
      (queryRunner.manager.find as jest.Mock).mockResolvedValue([
        { accountId: fromAcId, amount: -100 },
        { accountId: toAcId, amount: 100 },
      ]);

      const result = await service.transfer(transferDto);

      expect(result).toEqual({ isSuccess: true, transactionId });
    });

    it('should throw ConflictException if transaction is a duplicate but details differ (amount)', async () => {
      (queryRunner.manager.find as jest.Mock).mockResolvedValue([
        { accountId: fromAcId, amount: -500 }, // Different amount
        { accountId: toAcId, amount: 500 },
      ]);

      await expect(service.transfer(transferDto)).rejects.toThrow(
        new ConflictException(TRANSACTION_ID_ALREADY_EXISTS),
      );
    });

    it('should throw ConflictException if transaction is a duplicate but details differ (account)', async () => {
      (queryRunner.manager.find as jest.Mock).mockResolvedValue([
        { accountId: fromAcId, amount: -100 },
        { accountId: randomUUID(), amount: 100 }, // Different account
      ]);

      await expect(service.transfer(transferDto)).rejects.toThrow(
        new ConflictException(TRANSACTION_ID_ALREADY_EXISTS),
      );
    });

    it('should throw BadRequestException if account is not found', async () => {
      (queryRunner.manager.find as jest.Mock).mockResolvedValueOnce([]); // Duplicate check passes (no dupe)
      (queryRunner.manager.find as jest.Mock).mockResolvedValueOnce([]); // Lock check fails (missing accounts)

      await expect(service.transfer(transferDto)).rejects.toThrow(
        new BadRequestException(ACCOUNT_ID_NOT_FOUND),
      );
    });

    it('should throw UnprocessableEntityException if funds are insufficient', async () => {
      (queryRunner.manager.find as jest.Mock).mockResolvedValueOnce([]); // Duplicate check passes
      (queryRunner.manager.find as jest.Mock).mockResolvedValueOnce([
        { id: fromAcId },
        { id: toAcId },
      ]); // Accounts exist

      mockLedgerService.verifySufficientFunds.mockRejectedValueOnce(
        new UnprocessableEntityException('INSUFFICIENT_FUNDS'),
      );

      await expect(service.transfer(transferDto)).rejects.toThrow(
        new UnprocessableEntityException('INSUFFICIENT_FUNDS'),
      );
    });

    it('should successfully commit transfer when all conditions are met', async () => {
      (queryRunner.manager.find as jest.Mock).mockResolvedValueOnce([]); // Duplicate check
      (queryRunner.manager.find as jest.Mock).mockResolvedValueOnce([
        { id: fromAcId },
        { id: toAcId },
      ]); // Accounts exist

      mockLedgerService.verifySufficientFunds.mockResolvedValueOnce(undefined);
      mockLedgerService.createEntry.mockResolvedValue({});

      const result = await service.transfer(transferDto);

      expect(result).toEqual({ isSuccess: true, transactionId });
      expect(mockLedgerService.createEntry).toHaveBeenCalledTimes(2);
    });
  });
});
