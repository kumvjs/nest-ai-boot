import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Roles } from '#/modules/auth/auth.constant.js'
import { UserRoleService } from '#/modules/user/user-role/user-role.service.js'
import { MenuType, SysMenuEntity } from './entities/menu.entity.js'

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(SysMenuEntity)
    private menuRepository: Repository<SysMenuEntity>,
    private readonly userRoleService: UserRoleService,
  ) { }

  /**
   * 获取当前用户的所有权限
   */
  async getPermissionsByUserId(uid: string): Promise<string[]> {
    const [roleIds, roleCodes] = await Promise.all([
      this.userRoleService.getRoleIdsByUser(uid),
      this.userRoleService.getUserRoleCodes(uid),
    ])

    if (roleCodes.includes(Roles.SUPER))
      return this.getAllPermissions()

    return this.getMenusByRoleIds(roleIds)
  }

  async getMenusByRoleIds(roleIds: string[]): Promise<string[]> {
    if (!roleIds.length)
      return []

    const rows = await this.menuRepository
      .createQueryBuilder('menu')
      .select('menu.permission', 'permission')
      .innerJoin('menu.roleMenus', 'roleMenu')
      .innerJoin('roleMenu.role', 'role')
      .where('roleMenu.roleId IN (:...roleIds)', { roleIds })
      .andWhere('role.status = :roleStatus', { roleStatus: true })
      .andWhere('menu.status = :menuStatus', { menuStatus: true })
      .andWhere('menu.type IN (:...permissionTypes)', {
        permissionTypes: [MenuType.MENU, MenuType.BUTTON],
      })
      .andWhere('menu.permission IS NOT NULL')
      .getRawMany<{ permission: string }>()

    return this.normalizePermissions(rows)
  }

  async getAllPermissions(): Promise<string[]> {
    const rows = await this.menuRepository
      .createQueryBuilder('menu')
      .select('menu.permission', 'permission')
      .where('menu.status = :menuStatus', { menuStatus: true })
      .andWhere('menu.type IN (:...permissionTypes)', {
        permissionTypes: [MenuType.MENU, MenuType.BUTTON],
      })
      .andWhere('menu.permission IS NOT NULL')
      .getRawMany<{ permission: string }>()

    return this.normalizePermissions(rows)
  }

  private normalizePermissions(rows: Array<{ permission: string }>): string[] {
    return [...new Set(
      rows
        .flatMap(row => typeof row.permission === 'string' ? row.permission.split(',') : [])
        .map(permission => permission.trim())
        .filter(Boolean),
    )].sort()
  }
}
