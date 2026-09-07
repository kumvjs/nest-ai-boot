import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddVbenUserProfile1788774074964 implements MigrationInterface {
  name = 'AddVbenUserProfile1788774074964'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sys_user"
      ADD COLUMN "avatar" character varying(500),
      ADD COLUMN "home_path" character varying(255),
      ADD COLUMN "description" character varying(500)
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sys_user"
      DROP COLUMN "description",
      DROP COLUMN "home_path",
      DROP COLUMN "avatar"
    `)
  }
}
