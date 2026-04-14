/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from './accounts.service';
import {
  ACCOUNT_REPOSITORY,
  IResCreate,
  IResItem,
  DATABASE_SOURCE,
} from '@common/*';
import { AccountEntity } from './entities/account.entity';
import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Repository, DataSource } from 'typeorm';
import { CreateDto } from './dto/create.dto';
import { LedgerService } from '../ledger/services/ledger.service';

describe('AccountsService', () => {
  let service: AccountsService;
  let repository: jest.Mocked<Repository<AccountEntity>>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Repository<AccountEntity>>;

  const mockDataSource = {
    manager: {
      count: jest.fn(),
    },
  } as unknown as jest.Mocked<DataSource>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: ACCOUNT_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: DATABASE_SOURCE,
          useValue: mockDataSource,
        },
        {
          provide: LedgerService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    repository = module.get(ACCOUNT_REPOSITORY);
  });

  describe('create', () => {
    it('should create and save an account', async () => {
      const dto: CreateDto = { name: 'Test Account' };
      (mockRepository.create as jest.Mock).mockReturnValue(dto);
      (mockRepository.save as jest.Mock).mockResolvedValue({
        id: randomUUID(),
        ...dto,
      } as AccountEntity);

      const result: IResCreate<AccountEntity> = await service.create(dto);

      expect(result).toEqual({ isSuccess: true });
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an account if it exists', async () => {
      const id = randomUUID();
      const mockAccount = { id, name: 'Test' } as AccountEntity;
      (mockRepository.findOneBy as jest.Mock).mockResolvedValue(mockAccount);

      const result: IResItem<AccountEntity> = await service.findOne(id);

      expect(result).toEqual({ data: mockAccount, isSuccess: true });
      expect(repository.findOneBy).toHaveBeenCalledWith({ id });
    });

    it('should throw BadRequestException if account does not exist', async () => {
      (mockRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne(randomUUID())).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('delete', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should call repository delete', async () => {
      const id = randomUUID();
      (mockDataSource.manager.count as jest.Mock).mockResolvedValue(0);
      (mockRepository.delete as jest.Mock).mockResolvedValue({ affected: 1 });

      await service.delete(id);

      expect(repository.delete).toHaveBeenCalledWith(id);
    });

    it('should throw BadRequestException if account has ledgers', async () => {
      const id = randomUUID();
      (mockDataSource.manager.count as jest.Mock).mockResolvedValue(1);

      await expect(service.delete(id)).rejects.toThrow(BadRequestException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
