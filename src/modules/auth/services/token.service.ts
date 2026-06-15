import type { SecurityConfig } from '@/config'
import { Inject, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'

import dayjs from 'dayjs'

import { Repository } from 'typeorm'
import { ERROR_CODES } from '@/common/constants/error-code.constant'
import { BusinessException } from '@/common/exceptions/business.exception'

import { securityConfig } from '@/config'
import { RoleService } from '@/modules/system/role/role.service'
import { SysUserEntity } from '@/modules/user/entities/user.entity'
import { CacheService } from '@/shared/cache/cache.service'
import { authKeys } from '@/shared/cache/keys'
import { onlineKeys } from '@/shared/cache/keys/online.keys'
import { generateUUID } from '@/utils'
import { AccessTokenDto } from '../dto/access-token.dto'
import { RefreshTokenEntity } from '../entities/refresh-token.entity'
import { JwtStrategy } from '../strategies/jwt.strategy'

/**
 * 令牌服务
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly cacheService: CacheService,
    private jwtService: JwtService,
    private readonly jwtStrategy: JwtStrategy,
    private roleService: RoleService,
    @Inject(securityConfig.KEY) private securityConfig: SecurityConfig,
    @InjectRepository(RefreshTokenEntity) private refreshTokenRepo: Repository<RefreshTokenEntity>,

  ) { }

  generateJwtSign(payload: any) {
    const jwtSign = this.jwtService.sign(payload)

    return jwtSign
  }

  async generateAccessToken(uid: string) {
    const payload: AuthUser = {
      jwtUuid: generateUUID(),
      uid,
      pv: 1,
    }

    const jwtSign = await this.jwtService.signAsync(payload)

    // 存储用户的AccessToken
    await this.cacheService.setCache(
      authKeys.userTokens(uid, payload.jwtUuid),
      jwtSign,
      this.securityConfig.jwtExprire,
    )
    // 存储AccessToken的用户ID
    await this.cacheService.setCache(
      authKeys.accessToken(payload.jwtUuid),
      uid,
      this.securityConfig.jwtExprire,
    )
    return jwtSign
  }

  /**
   * 生成新的RefreshToken并存入数据库
   * @param accessToken
   * @param now
   */
  async generateRefreshToken(
    payload: AuthUser,
    now: dayjs.Dayjs,
  ): Promise<string> {
    payload.jwtUuid = generateUUID()
    const refreshTokenSign = await this.jwtService.signAsync(payload, {
      secret: this.securityConfig.refreshSecret,
      expiresIn: `${this.securityConfig.refreshExpire}s`,
    })

    await this.refreshTokenRepo.save({
      value: refreshTokenSign,
      expired_at: now
        .add(this.securityConfig.refreshExpire, 'second')
        .toDate(),
      user: { id: payload.uid },
    })
    // 存储RefreshToken的用户ID
    await this.cacheService.setCache(
      authKeys.userRefreshTokens(payload.uid, payload.jwtUuid),
      payload.uid,
      this.securityConfig.refreshExpire,
    )
    return refreshTokenSign
  }

  async refreshToken(oldRefreshToken: string) {
    // 1. 验证旧 Token
    const checkRefreshToken = await this.checkRefreshToken(oldRefreshToken)
    if (!checkRefreshToken) {
      throw new BusinessException(ERROR_CODES.AUTH_REFRESH_TOKEN_EXPIRED)
    }
    const tokenRecord = await this.refreshTokenRepo.findOne({ where: { value: oldRefreshToken } })
    if (!tokenRecord || dayjs(tokenRecord.expired_at).isBefore(dayjs())) {
      throw new BusinessException(ERROR_CODES.AUTH_REFRESH_TOKEN_EXPIRED)
    }

    const userId = tokenRecord.userId

    // 2. 废弃旧 refreshToken
    await this.removeRefreshToken(oldRefreshToken)

    // 3. 生成新的 RefreshToken（全新有效期）
    const refreshTokenPayload: AuthUser = {
      jwtUuid: generateUUID(),
      uid: userId,
      pv: 1,
    }

    const newRefreshToken = await this.generateRefreshToken(refreshTokenPayload, dayjs())

    // 4. 生成新的 AccessToken
    const accessToken = await this.generateAccessToken(userId)

    return {
      accessToken,
      refreshToken: newRefreshToken,
    }
  }

  /**
   * 检查accessToken是否存在，并且是否处于有效期内
   * @param value
   */
  async checkAccessToken(value: string) {
    let isValid = false
    try {
      const loginUser = await this.verifyAccessToken(value)
      const res = await this.cacheService.getCache(authKeys.userTokens(loginUser.uid, loginUser.tokenInfo.jwtUuid))
      isValid = Boolean(res)
    }
    catch (error) { }

    return isValid
  }

  /**
   * 移除AccessToken且自动移除关联的RefreshToken
   * @param value
   */
  async removeAccessTokenByJwtUuid(jwtUuid: string) {
    const userId = await this.cacheService.getCache(authKeys.accessToken(jwtUuid))
    await this.cacheService.delCache(authKeys.accessToken(jwtUuid))
    if (userId) {
      await this.cacheService.delCache(authKeys.userTokens(userId, jwtUuid))
      await this.cacheService.delCache(onlineKeys.user(userId))
    }
  }

  /**
   * 移除RefreshToken
   * @param value
   */
  async removeRefreshToken(value: string) {
    const user = await this.verifyRefreshToken(value)
    const refreshToken = await RefreshTokenEntity.findOne({
      where: { value },
    })
    if (refreshToken) {
      await refreshToken.remove()
    }
    await this.cacheService.delCache(authKeys.userRefreshTokens(user.uid, user.jwtUuid))
  }

  /**
   * 验证Token是否正确,如果正确则返回所属用户对象
   * @param token
   */
  async verifyAccessToken(token: string): Promise<LoginUserContext> { // 2. 手动触发你写在 Strategy 里的 validate 逻辑
    try {
      // 1. 解密并验证签名，拿到 payload
      const payload: AuthUser = await this.jwtService.verifyAsync(token)

      // 2. 手动触发你写在 Strategy 里的 validate 逻辑
      const user = await this.jwtStrategy.validate(payload)

      if (!user) {
        throw new BusinessException(ERROR_CODES.AUTH_TOKEN_INVALID)
      }

      return user // 此时返回的结构就和 HTTP 接口完全一样了
    }
    catch (error) {
      throw new BusinessException(ERROR_CODES.AUTH_TOKEN_INVALID)
    }
  }

  /**
   * 检查accessToken是否存在，并且是否处于有效期内
   * @param value
   */
  async checkRefreshToken(refreshToken: string) {
    let isValid = false
    try {
      const user = await this.verifyRefreshToken(refreshToken)
      const res = await this.cacheService.getCache(authKeys.userRefreshTokens(user.uid, user.jwtUuid))
      isValid = Boolean(res)
    }
    catch (error) { }

    return isValid
  }

  /**
   * 验证refreshToken是否正确,如果正确则返回所属用户对象
   * @param token
   */
  async verifyRefreshToken(refreshToken: string): Promise<AuthUser> {
    return this.jwtService.verifyAsync(refreshToken, {
      secret: this.securityConfig.refreshSecret,
    })
  }
}
