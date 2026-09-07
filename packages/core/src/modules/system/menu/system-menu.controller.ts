import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { ApiResult } from '#/common/decorators/api-result.decorator.js'
import { ApiSecurityAuth } from '#/common/decorators/swagger.decorator.js'
import { RequirePermissions } from '#/modules/auth/decorators/index.js'
import { MenuNameExistsQueryDto, MenuPathExistsQueryDto } from './dto/menu-exists-query.dto.js'
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

  @Get('name-exists')
  @RequirePermissions(MENU_PERMISSIONS.LIST)
  @ApiOperation({ summary: '检查菜单名称是否已存在' })
  @ApiResult({ type: Boolean })
  async nameExists(@Query() query: MenuNameExistsQueryDto): Promise<boolean> {
    return this.menuService.isMenuNameExists(query.name, query.id)
  }

  @Get('path-exists')
  @RequirePermissions(MENU_PERMISSIONS.LIST)
  @ApiOperation({ summary: '检查菜单路径是否已存在' })
  @ApiResult({ type: Boolean })
  async pathExists(@Query() query: MenuPathExistsQueryDto): Promise<boolean> {
    return this.menuService.isMenuPathExists(query.path, query.id)
  }
}
