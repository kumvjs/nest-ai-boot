import type { QueryRunner } from 'typeorm'
import { AddVbenUserProfile1788774074964 } from './1788774074964-add-vben-user-profile.js'

describe('add Vben user profile migration', () => {
  const queryRunner = {
    query: jest.fn(),
  }
  const migration = new AddVbenUserProfile1788774074964()

  beforeEach(() => {
    jest.clearAllMocks()
    queryRunner.query.mockResolvedValue(undefined)
  })

  it('adds persistent avatar, home path, and description columns', async () => {
    await migration.up(queryRunner as unknown as QueryRunner)

    expect(queryRunner.query).toHaveBeenCalledTimes(1)
    expect(queryRunner.query.mock.calls[0][0]).toContain('ADD COLUMN "avatar"')
    expect(queryRunner.query.mock.calls[0][0]).toContain('ADD COLUMN "home_path"')
    expect(queryRunner.query.mock.calls[0][0]).toContain('ADD COLUMN "description"')
  })

  it('drops all added columns in reverse order', async () => {
    await migration.down(queryRunner as unknown as QueryRunner)

    expect(queryRunner.query).toHaveBeenCalledTimes(1)
    expect(queryRunner.query.mock.calls[0][0]).toContain('DROP COLUMN "description"')
    expect(queryRunner.query.mock.calls[0][0]).toContain('DROP COLUMN "home_path"')
    expect(queryRunner.query.mock.calls[0][0]).toContain('DROP COLUMN "avatar"')
  })
})
