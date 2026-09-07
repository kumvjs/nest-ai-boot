import type { MenuMeta, MenuMetaValue } from '../menu.types.js'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { MenuStatus, MenuType } from '../menu.types.js'

export class VbenMenuMetaDto implements MenuMeta {
  [key: string]: MenuMetaValue | undefined

  @ApiPropertyOptional()
  activeIcon?: string

  @ApiPropertyOptional()
  activePath?: string

  @ApiPropertyOptional()
  affixTab?: boolean

  @ApiPropertyOptional()
  affixTabOrder?: number

  @ApiPropertyOptional({ type: [String] })
  authority?: string[]

  @ApiPropertyOptional()
  badge?: string

  @ApiPropertyOptional({ enum: ['dot', 'normal'] })
  badgeType?: 'dot' | 'normal'

  @ApiPropertyOptional()
  badgeVariants?: string

  @ApiPropertyOptional()
  hideChildrenInMenu?: boolean

  @ApiPropertyOptional()
  hideInBreadcrumb?: boolean

  @ApiPropertyOptional()
  hideInMenu?: boolean

  @ApiPropertyOptional()
  hideInTab?: boolean

  @ApiPropertyOptional()
  icon?: string

  @ApiPropertyOptional()
  iframeSrc?: string

  @ApiPropertyOptional()
  keepAlive?: boolean

  @ApiPropertyOptional()
  link?: string

  @ApiPropertyOptional()
  maxNumOfOpenTab?: number

  @ApiPropertyOptional()
  noBasicLayout?: boolean

  @ApiPropertyOptional()
  openInNewWindow?: boolean

  @ApiPropertyOptional()
  order?: number

  @ApiPropertyOptional({ additionalProperties: true, type: 'object' })
  query?: Record<string, MenuMetaValue>

  @ApiPropertyOptional()
  title?: string
}

/** Vben system-menu create/update payload. */
export class VbenMenuWriteDto {
  @ApiPropertyOptional({ description: '兼容 Vben 表单顶层字段；写服务归入 meta.activePath' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  activePath?: string

  @ApiPropertyOptional({ description: '菜单/按钮权限码' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  authCode?: string

  @ApiPropertyOptional({ description: '前端组件路径' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  component?: string

  @ApiPropertyOptional({ description: '兼容 Vben 表单字段；meta.link/iframeSrc 是规范存储位置' })
  @IsOptional()
  @IsString()
  @MaxLength(2_048)
  linkSrc?: string

  @ApiPropertyOptional({ additionalProperties: true, type: VbenMenuMetaDto })
  @IsOptional()
  @IsObject()
  meta?: VbenMenuMetaDto

  @ApiProperty({ maxLength: 30, minLength: 2 })
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  name: string

  @ApiPropertyOptional({ description: '父菜单 ID；根节点可省略或传 0' })
  @IsOptional()
  @IsString()
  pid?: string

  @ApiPropertyOptional({ description: '路由路径' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  path?: string

  @ApiPropertyOptional({ description: '重定向路径' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  redirect?: string

  @ApiProperty({ enum: MenuStatus })
  @IsEnum(MenuStatus)
  status: MenuStatus

  @ApiProperty({ enum: MenuType })
  @IsEnum(MenuType)
  type: MenuType
}

export class VbenMenuResponseDto {
  @ApiPropertyOptional({ description: '兼容 Vben v5.7.0 菜单编辑表单' })
  activePath?: string

  @ApiPropertyOptional()
  authCode?: string

  @ApiPropertyOptional({ type: () => [VbenMenuResponseDto] })
  children?: VbenMenuResponseDto[]

  @ApiPropertyOptional()
  component?: string

  @ApiProperty({ type: String })
  id: string

  @ApiPropertyOptional({ additionalProperties: true, type: VbenMenuMetaDto })
  meta?: VbenMenuMetaDto

  @ApiProperty()
  name: string

  @ApiPropertyOptional({ type: String })
  pid?: string

  @ApiPropertyOptional()
  path?: string

  @ApiPropertyOptional()
  redirect?: string

  @ApiProperty({ enum: MenuStatus })
  status: MenuStatus

  @ApiProperty({ enum: MenuType })
  type: MenuType
}

export class VbenRouteRecordDto {
  @ApiPropertyOptional({ type: () => [VbenRouteRecordDto] })
  children?: VbenRouteRecordDto[]

  @ApiPropertyOptional()
  component?: string

  @ApiPropertyOptional({ additionalProperties: true, type: VbenMenuMetaDto })
  meta?: VbenMenuMetaDto

  @ApiProperty()
  name: string

  @ApiProperty()
  path: string

  @ApiPropertyOptional()
  redirect?: string
}
