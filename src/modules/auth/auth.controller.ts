import type { FastifyReply, FastifyRequest } from 'fastify'
import type { SecurityConfig } from '#/config/index.js'
import { Body, Controller, Get, Headers, Inject, Post, Req, Res } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { ERROR_CODES } from '#/common/constants/error-code.constant.js'
import { ApiResult } from '#/common/decorators/api-result.decorator.js'
import { CurrentUser } from '#/common/decorators/current-user.decorator.js'
import { GetIp } from '#/common/decorators/http.decorator.js'
import { Public } from '#/common/decorators/public.decorator.js'
import { ApiSecurityAuth } from '#/common/decorators/swagger.decorator.js'
import { BusinessException } from '#/common/exceptions/business.exception.js'
import { securityConfig } from '#/config/index.js'
import { AuthService } from './auth.service.js'
import { LoginDto, LoginTokenResponseDto } from './dto/auth.dto.js'
import { CaptchaService } from './services/captcha.service.js'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly captchaService: CaptchaService,
    @Inject(securityConfig.KEY) private securityConfig: SecurityConfig,
  ) { }

  @Post('login')
  @Public()
  @ApiOperation({ summary: '登录' })
  @ApiResult({ type: LoginTokenResponseDto })
  async login(@Body() dto: LoginDto, @GetIp() ip: string, @Headers('user-agent') ua: string, @Res({ passthrough: true }) res: FastifyReply): Promise<LoginTokenResponseDto> {
    // await this.captchaService.checkImgCaptcha(dto.captchaId, dto.verifyCode)
    const { accessToken, refreshToken } = await this.authService.login(
      dto.username,
      dto.password,
      ip,
      ua,
    )
    // 设置refreshToken cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true, // production 必须 true
      sameSite: 'strict', // 防 CSRF（或 lax）
      maxAge: this.securityConfig.refreshExpire,
    })
    return { accessToken }
  }

  @Post('logout')
  @ApiOperation({ summary: '账户登出' })
  async logout(@CurrentUser() user: LoginUserContext): Promise<void> {
    return this.authService.clearLoginStatus(user.tokenInfo)
  }

  @Post('refresh')
  @Public()
  @ApiResult({ type: LoginTokenResponseDto })
  @ApiOperation({ summary: '根据refreshToken刷新accessToken' })
  async refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const oldRefreshToken = req.cookies?.refresh_token

    if (!oldRefreshToken) {
      throw new BusinessException(ERROR_CODES.AUTH_REFRESH_TOKEN_MISSING)
    }

    const { accessToken, refreshToken } = await this.authService.refreshToken(oldRefreshToken)

    // 设置refreshToken cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true, // production 必须 true
      sameSite: 'strict', // 防 CSRF（或 lax）
      maxAge: this.securityConfig.refreshExpire,
    })
    return { accessToken }
  }

  @Get('codes')
  @ApiSecurityAuth()
  @ApiOperation({ summary: '获取用户的权限码' })
  async codes(@CurrentUser() user: LoginUserContext) {
    return user.roleCodes
  }
}
