/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { LedgerService } from '../services/ledger.service';
import { randomUUID } from 'crypto';
import { CreateDto } from './dto/create.dto';
import { AccountEntity } from './entities/account.entity';
import { IResCreate } from '@common/*';

describe('AccountsController', () => {
  let controller: AccountsController;
  let accountsService: AccountsService;
  let ledgerService: LedgerService;

  const mockAccountsService: jest.Mocked<Partial<AccountsService>> = {
    create: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockLedgerService: jest.Mocked<Partial<LedgerService>> = {
    getBalance: jest.fn(),
    findByAccount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        {
          provide: AccountsService,
          useValue: mockAccountsService,
        },
        {
          provide: LedgerService,
          useValue: mockLedgerService,
        },
      ],
    }).compile();

    controller = module.get<AccountsController>(AccountsController);
    accountsService = module.get<AccountsService>(AccountsService);
    ledgerService = module.get<LedgerService>(LedgerService);
  });

  describe('create', () => {
    it('should call accountsService.create', async () => {
      const dto: CreateDto = { name: 'Test' };
      (mockAccountsService.create as jest.Mock).mockResolvedValue({
        isSuccess: true,
      } as IResCreate<AccountEntity>);

      const result = await controller.create(dto);

      expect(result.data).toEqual({ isSuccess: true });
      expect(accountsService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('getBalance', () => {
    it('should call ledgerService.getBalance', async () => {
      const id = randomUUID();
      (mockLedgerService.getBalance as jest.Mock).mockResolvedValue({
        balance: 100,
      });

      const result = await controller.getBalance(id);

      expect(result.data).toEqual({ balance: 100 });
      expect(ledgerService.getBalance).toHaveBeenCalledWith(id);
    });
  });

  describe('delete', () => {
    it('should call accountsService.delete', async () => {
      const id = randomUUID();
      (mockAccountsService.delete as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.delete(id);

      expect(result).toBeUndefined();
      expect(accountsService.delete).toHaveBeenCalledWith(id);
    });
  });
});
