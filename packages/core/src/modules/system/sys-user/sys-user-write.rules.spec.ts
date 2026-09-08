import { UnprocessableEntityException } from '@nestjs/common'
import { buildSysUserWriteState, normalizeRoleIds } from './sys-user-write.rules.js'
import { UserStatus } from './sys-user.types.js'

describe('system-user write rules', () => {
  const current = {
    avatar: null,
    deptId: '1',
    description: null,
    homePath: '/workspace',
    name: 'Existing User',
    remark: null,
    status: UserStatus.ENABLED,
    timezone: null,
    username: 'immutable.login',
  } as any

  it('normalizes bigint role IDs and partial nullable fields', () => {
    expect(normalizeRoleIds(['10', '2'])).toEqual(['2', '10'])
    expect(buildSysUserWriteState({ remark: '' }, current)).toMatchObject({
      deptId: '1',
      name: 'Existing User',
      remark: null,
      username: 'immutable.login',
    })
  })

  it('preserves immutable username even if a direct caller injects it', () => {
    expect(buildSysUserWriteState({ username: 'attacker' } as any, current).username)
      .toBe('immutable.login')
  })

  it.each([
    [['0'], 'PostgreSQL bigint'],
    [['9223372036854775808'], 'PostgreSQL bigint'],
    [['1', '1'], '重复'],
    [[], '1 到 100'],
  ])('rejects invalid role assignment %#', (roleIds, message) => {
    expect(() => normalizeRoleIds(roleIds)).toThrow(message)
  })

  it('rejects missing create fields and invalid direct service payloads', () => {
    expect(() => buildSysUserWriteState({} as any)).toThrow(UnprocessableEntityException)
    expect(() => buildSysUserWriteState({ status: true } as any, current)).toThrow('status 必须是 0 或 1')
    expect(() => buildSysUserWriteState({ homePath: 'javascript:alert(1)' } as any, current)).toThrow('homePath')
  })
})
