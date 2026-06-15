import { Controller, Get } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { ApiResult } from '@/common/decorators/api-result.decorator'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { ApiSecurityAuth } from '@/common/decorators/swagger.decorator'
import { SysUserEntity } from './entities/user.entity'
import { UserService } from './user.service'

@Controller('user')
@ApiSecurityAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('info')
  @ApiOperation({ summary: '用户信息' })
  @ApiResult({ type: SysUserEntity })
  async info(@CurrentUser() user: LoginUserContext) {
    const u = await this.userService.getUserById(user.uid)
    return {
      ...u,
      realName: u?.nickname,
      roles: [
        'super',
      ],
    }
  }
}
