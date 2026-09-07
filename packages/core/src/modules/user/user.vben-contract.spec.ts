import type { Repository } from 'typeorm'
import { ResOp } from '#/common/dto/response.dto.js'
import { CacheService } from '#/shared/cache/cache.service.js'
import { SysUserEntity } from './entities/user.entity.js'
import { UserRoleService } from './user-role/user-role.service.js'
import { UserController } from './user.controller.js'
import { UserService } from './user.service.js'

describe('vben current-user contract', () => {
  const userRepository = {
    findOne: jest.fn(),
  }
  const userRoleService = {
    getUserRoleCodes: jest.fn(),
  }
  const service = new UserService(
    {} as CacheService,
    userRepository as unknown as Repository<SysUserEntity>,
    userRoleService as unknown as UserRoleService,
  )
  const controller = new UserController(service)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('maps the entity to a dedicated Vben DTO without exposing internal fields', async () => {
    userRepository.findOne.mockResolvedValue({
      createdAt: new Date('2026-09-07T00:00:00.000Z'),
      id: '9007199254740993',
      nickname: 'Administrator',
      password_hash: 'must-not-leak',
      psalt: 'must-not-leak',
      role: 'admin',
      status: true,
      username: 'admin',
    })
    userRoleService.getUserRoleCodes.mockResolvedValue(['super'])

    const data = await controller.info({ uid: '9007199254740993' } as LoginUserContext)

    expect(data).toEqual({
      realName: 'Administrator',
      roles: ['super'],
      userId: '9007199254740993',
      username: 'admin',
    })
    expect(data).not.toHaveProperty('id')
    expect(data).not.toHaveProperty('password_hash')
    expect(data).not.toHaveProperty('psalt')
    expect(ResOp.success(data)).toMatchObject({
      code: 0,
      data: {
        realName: 'Administrator',
        roles: ['super'],
        userId: '9007199254740993',
        username: 'admin',
      },
      success: true,
    })
  })
})
