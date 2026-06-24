import type { AppConfig, SecurityConfig } from '@/config'
import { Inject, Injectable } from '@nestjs/common'
import dayjs from 'dayjs'
import { ERROR_CODES } from '@/common/constants/error-code.constant'
import { BusinessException } from '@/common/exceptions/business.exception'
import { APP_CONFIG, securityConfig } from '@/config'
import { CacheService } from '@/shared/cache/cache.service'
import { authKeys } from '@/shared/cache/keys/auth.keys'
import { generateUUID } from '@/utils'
import { LoginLogService } from '../system/log/services/login-log.service'
import { MenuService } from '../system/menu/menu.service'
import { UserService } from '../user/user.service'
import { TokenService } from './services/token.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private menuService: MenuService,
    @Inject(securityConfig.KEY) private securityConfig: SecurityConfig,
    @Inject(APP_CONFIG.KEY) private appConfig: AppConfig,
    private loginLogService: LoginLogService,
  ) { }

  async validateUser(credential: string, password: string): Promise<any> {
    const user = await this.userService.findUserForLogin(credential)

    if (!user)
      throw new BusinessException(ERROR_CODES.USER_PASSWORD_ERROR) // 不提示账户不存在 防止扫用户账号

    if (!user.verifyPassword(password))
      throw new BusinessException(ERROR_CODES.USER_PASSWORD_ERROR)

    if (user) {
      const { password_hash, ...result } = user
      return result
    }

    return null
  }

  /**
   * 获取登录JWT
   * 返回null则账号密码有误，不存在该用户
   */
  async login(
    username: string,
    password: string,
    ip: string,
    ua: string,
  ) {
    const user = await this.validateUser(username, password)
    if (!user)
      throw new BusinessException(ERROR_CODES.USER_PASSWORD_ERROR)

    // 生成refreshToken
    const refreshTokenPayload: AuthUser = {
      jwtUuid: generateUUID(),
      uid: user.id,
      pv: 1,
    }
    const refreshToken = await this.tokenService.generateRefreshToken(refreshTokenPayload, dayjs())

    // 包含access_token和refresh_token
    const accessToken = await this.tokenService.generateAccessToken(user.id)

    // 设置密码版本号 当密码修改时，版本号+1
    await this.cacheService.setCache(authKeys.passwordVersion(user.id), 1)

    // 设置菜单权限
    const permissions = await this.menuService.getPermissionsByUserId(user.id)
    await this.setPermissionsCache(user.id, permissions)

    await this.loginLogService.create(user.id, ip, ua)

    return {
      accessToken,
      refreshToken,
    }
  }

  async refreshToken(refreshToken: string) {
    return this.tokenService.refreshToken(refreshToken)
  }

  /**
   * 清除登录状态信息
   */
  async clearLoginStatus(user: AuthUser): Promise<void> {
    const now = Math.floor(Date.now() / 1000)
    const ttl = user.exp
      ? Math.max(0, user.exp - now)
      : this.securityConfig.jwtExprire

    await this.cacheService.setCache(
      authKeys.tokenBlacklist(user.jwtUuid),
      '1',
      ttl,
    )
    await this.tokenService.removeAccessTokenByJwtUuid(user.jwtUuid)
  }

  async getPasswordVersionByUid(uid: string) {
    return await this.cacheService.getCache(authKeys.passwordVersion(uid))
  }

  async getTokenByUid(uid: string, jwtUuid: string = '') {
    return await this.cacheService.getCache(authKeys.userTokens(uid, jwtUuid))
  }

  /**
   * 获取权限列表
   */
  async getPermissionsByUserId(userId: string): Promise<string[]> {
    return this.menuService.getPermissionsByUserId(userId)
  }

  async setPermissionsCache(userId: string, permissions: string[]): Promise<void> {
    await this.cacheService.setCache(authKeys.userPermissions(userId), permissions)
  }

  async getPermissionsCache(userId: number): Promise<string[]> {
    const permissionString = await this.cacheService.getCache(authKeys.userPermissions(userId))
    return permissionString || []
  }
}
