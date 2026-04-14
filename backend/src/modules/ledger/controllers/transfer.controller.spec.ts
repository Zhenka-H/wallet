/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { TransferController } from './transfer.controller';
import {
  TransferService,
  ITransferResult,
} from '../../services/transfer.service';
import { randomUUID } from 'crypto';
import { TransferDto } from '../dto/transfer.dto';

describe('TransferController', () => {
  let controller: TransferController;
  let service: TransferService;

  const mockTransferService: jest.Mocked<Partial<TransferService>> = {
    transfer: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransferController],
      providers: [
        {
          provide: TransferService,
          useValue: mockTransferService,
        },
      ],
    }).compile();

    controller = module.get<TransferController>(TransferController);
    service = module.get<TransferService>(TransferService);
  });

  it('should call transfer service with dto', async () => {
    const transactionId = randomUUID();
    const dto: TransferDto = {
      transactionId,
      fromAcId: randomUUID(),
      toAcId: randomUUID(),
      amount: 100,
    };
    const expectedResult: ITransferResult = { isSuccess: true, transactionId };
    (mockTransferService.transfer as jest.Mock).mockResolvedValue(
      expectedResult,
    );

    const result = await controller.execute(dto);

    expect(result).toBe(expectedResult);
    expect(service.transfer).toHaveBeenCalledWith(dto);
  });
});
