import type { AppConfig, SecurityConfig } from '#/config/index.js'
import type { CacheService } from '#/shared/cache/cache.service.js'
import type { LoginLogService } from '../system/log/services/login-log.service.js'
import type { MenuService } from '../system/menu/menu.service.js'
import type { UserRoleService } from '../user/user-role/user-role.service.js'
import type { UserService } from '../user/user.service.js'
import type { TokenService } from './services/token.service.js'
import { authKeys } from '#/shared/cache/keys/auth.keys.js'
import { AuthService } from './auth.service.js'

jest.mock('#/config/index.js', () => ({
  APP_CONFIG: { KEY: 'appConfig' },
  securityConfig: { KEY: 'securityConfig' },
}))

describe('vben logout lifecycle', () => {
  const cacheService = {
    setCache: jest.fn(),
  }
  const tokenService = {
    removeAccessTokenByJwtUuid: jest.fn(),
    revokeRefreshToken: jest.fn(),
  }
  const security = {
    jwtExprire: 3_600,
  } as SecurityConfig
  const service = new AuthService(
    cacheService as unknown as CacheService,
    {} as UserService,
    tokenService as unknown as TokenService,
    {} as MenuService,
    security,
    {} as AppConfig,
    {} as LoginLogService,
    {} as UserRoleService,
  )

  beforeEach(() => {
    jest.clearAllMocks()
    cacheService.setCache.mockResolvedValue(undefined)
    tokenService.removeAccessTokenByJwtUuid.mockResolvedValue(undefined)
    tokenService.revokeRefreshToken.mockResolvedValue(undefined)
  })

  it('blacklists the access token and revokes both server-side token states', async () => {
    const now = Math.floor(Date.now() / 1000)
    const tokenInfo: AuthUser = {
      exp: now + 300,
      jwtUuid: 'access-token-uuid',
      pv: 1,
      uid: '42',
    }

    await service.clearLoginStatus(tokenInfo, 'refresh-token')

    expect(cacheService.setCache).toHaveBeenCalledWith(
      authKeys.tokenBlacklist('access-token-uuid'),
      '1',
      expect.any(Number),
    )
    expect(tokenService.removeAccessTokenByJwtUuid).toHaveBeenCalledWith('access-token-uuid')
    expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith('refresh-token')
  })
})
