import type { JwtService } from '@nestjs/jwt'
import type { Repository } from 'typeorm'
import type { SecurityConfig } from '#/config/index.js'
import type { RoleService } from '#/modules/system/role/role.service.js'
import type { CacheService } from '#/shared/cache/cache.service.js'
import type { RefreshTokenEntity } from '../entities/refresh-token.entity.js'
import type { JwtStrategy } from '../strategies/jwt.strategy.js'
import { authKeys } from '#/shared/cache/keys/index.js'
import { TokenService } from './token.service.js'

jest.mock('#/config/index.js', () => ({
  securityConfig: { KEY: 'securityConfig' },
}))

describe('vben refresh-token lifecycle', () => {
  const cacheService = {
    delCache: jest.fn(),
    getCache: jest.fn(),
    setCache: jest.fn(),
  }
  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  }
  const refreshTokenRepo = {
    delete: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  }
  const security = {
    jwtExprire: 3_600,
    refreshExpire: 604_800,
    refreshSecret: 'refresh-secret',
  } as SecurityConfig
  const service = new TokenService(
    cacheService as unknown as CacheService,
    jwtService as unknown as JwtService,
    {} as JwtStrategy,
    {} as RoleService,
    security,
    refreshTokenRepo as unknown as Repository<RefreshTokenEntity>,
  )
  const oldPayload: AuthUser = {
    jwtUuid: 'old-refresh-uuid',
    pv: 1,
    uid: '42',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jwtService.verifyAsync.mockResolvedValue(oldPayload)
    cacheService.getCache.mockResolvedValue('42')
    cacheService.setCache.mockResolvedValue(undefined)
    cacheService.delCache.mockResolvedValue(undefined)
    refreshTokenRepo.findOne.mockResolvedValue({
      expired_at: new Date(Date.now() + 60_000),
      userId: '42',
      value: 'old-refresh-token',
    })
    refreshTokenRepo.save.mockResolvedValue(undefined)
  })

  it('rotates once and atomically rejects replay of the consumed token', async () => {
    refreshTokenRepo.delete
      .mockResolvedValueOnce({ affected: 1 })
      .mockResolvedValueOnce({ affected: 0 })
    jwtService.signAsync
      .mockResolvedValueOnce('new-refresh-token')
      .mockResolvedValueOnce('new-access-token')

    await expect(service.refreshToken('old-refresh-token')).resolves.toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    })
    await expect(service.refreshToken('old-refresh-token')).rejects.toMatchObject({
      status: 401,
    })

    expect(refreshTokenRepo.save).toHaveBeenCalledTimes(1)
    expect(cacheService.delCache).toHaveBeenCalledWith(
      authKeys.userRefreshTokens('42', 'old-refresh-uuid'),
    )
  })

  it('rejects an expired database record before issuing new tokens', async () => {
    refreshTokenRepo.findOne.mockResolvedValue({
      expired_at: new Date(Date.now() - 1_000),
      userId: '42',
      value: 'expired-refresh-token',
    })

    await expect(service.refreshToken('expired-refresh-token')).rejects.toMatchObject({
      status: 401,
    })
    expect(refreshTokenRepo.delete).not.toHaveBeenCalled()
    expect(jwtService.signAsync).not.toHaveBeenCalled()
  })

  it('revokes the persisted and cached refresh token during logout', async () => {
    refreshTokenRepo.delete.mockResolvedValue({ affected: 1 })

    await service.revokeRefreshToken('refresh-token')

    expect(refreshTokenRepo.delete).toHaveBeenCalledWith({ value: 'refresh-token' })
    expect(cacheService.delCache).toHaveBeenCalledWith(
      authKeys.userRefreshTokens('42', 'old-refresh-uuid'),
    )
  })

  it('removes a malformed refresh-token record without trusting its payload', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'))
    refreshTokenRepo.delete.mockResolvedValue({ affected: 1 })

    await service.revokeRefreshToken('malformed-refresh-token')

    expect(refreshTokenRepo.delete).toHaveBeenCalledWith({ value: 'malformed-refresh-token' })
    expect(cacheService.delCache).not.toHaveBeenCalled()
  })
})
