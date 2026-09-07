import { Controller, Get } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { ApiResult } from '#/common/decorators/api-result.decorator.js'
import { ApiSecurityAuth } from '#/common/decorators/swagger.decorator.js'
import { RequirePermissions } from '#/modules/auth/decorators/index.js'
import { VbenMenuResponseDto } from './dto/vben-menu.dto.js'
import { MenuService } from './menu.service.js'
import { MENU_PERMISSIONS } from './menu.types.js'

@Controller('system/menu')
@ApiSecurityAuth()
export class SystemMenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('list')
  @RequirePermissions(MENU_PERMISSIONS.LIST)
  @ApiOperation({ summary: '获取完整菜单管理树' })
  @ApiResult({ type: [VbenMenuResponseDto] })
  async list(): Promise<VbenMenuResponseDto[]> {
    return this.menuService.getSystemMenuList()
  }
}
