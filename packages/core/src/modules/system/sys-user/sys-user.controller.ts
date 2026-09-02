import type { PaginateQuery } from 'nestjs-paginate'
import { Controller, Get } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { Paginate } from 'nestjs-paginate'
import { ApiResult } from '#/common/decorators/api-result.decorator.js'
import { ApiSecurityAuth } from '#/common/decorators/swagger.decorator.js'
import { SysUserEntity } from '#/modules/user/entities/user.entity.js'
import { SysUserService } from './sys-user.service.js'

@Controller('user')
@ApiSecurityAuth()
export class SysUserController {
  constructor(private readonly sysUserService: SysUserService) { }

  @Get('list')
  @ApiOperation({ summary: '用户列表' })
  @ApiResult({ type: [SysUserEntity], isPage: true })
  async list(
    @Paginate() query: PaginateQuery,
  ) {
    return this.sysUserService.list(query)
  }
}
