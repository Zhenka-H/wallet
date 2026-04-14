import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccountsTable1775923861312 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "main"."accounts" (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       name VARCHAR(128) NOT NULL,
       created_at TIMESTAMP NOT NULL DEFAULT now(),
       updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "main"."accounts"`);
  }
}
