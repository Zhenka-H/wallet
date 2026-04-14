import { UUID } from 'crypto';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccountEntity } from '../../accounts/entities/account.entity';

@Entity({ name: 'ledger_entries', schema: 'main' })
@Index(['transactionId', 'accountId'], { unique: true })
export class LedgerEntryEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @Column({
    type: 'uuid',
    name: 'transaction_id',
    unique: true,
  })
  @Index()
  transactionId: string;

  @ManyToOne(() => AccountEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'account_id' })
  account: AccountEntity;

  @Column({ name: 'account_id', type: 'uuid' })
  @Index()
  accountId: string;

  @Column({
    type: 'numeric',
    precision: 19,
    scale: 4,
  })
  amount: number;

  @CreateDateColumn({
    name: 'timestamp',
  })
  timestamp: Date;
}
