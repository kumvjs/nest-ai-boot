import { Controller, Get } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { ApiResult } from '#/common/decorators/api-result.decorator.js'
import { CurrentUser } from '#/common/decorators/current-user.decorator.js'
import { ApiSecurityAuth } from '#/common/decorators/swagger.decorator.js'
import { SysUserEntity } from './entities/user.entity.js'
import { UserService } from './user.service.js'

@Controller('user')
@ApiSecurityAuth()
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('info')
  @ApiOperation({ summary: '用户信息' })
  @ApiResult({ type: SysUserEntity })
  async info(@CurrentUser() user: LoginUserContext) {
    return this.userService.info(user.uid)
  }
}
