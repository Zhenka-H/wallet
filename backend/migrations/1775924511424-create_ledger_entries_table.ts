import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLedgerEntriesTable1775924511424
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "main"."ledger_entries" (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       transaction_id UUID NOT NULL,
       account_id UUID NOT NULL REFERENCES "main"."accounts"(id) ON DELETE RESTRICT ON UPDATE NO ACTION,
       amount NUMERIC(19,4) NOT NULL,
       timestamp TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_ledger_entries_transaction_id" ON "main"."ledger_entries" ("transaction_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ledger_entries_account_id" ON "main"."ledger_entries" ("account_id");`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ledger_entries_transaction_account" ON "main"."ledger_entries" ("transaction_id", "account_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "main"."ledger_entries"`);
  }
}
