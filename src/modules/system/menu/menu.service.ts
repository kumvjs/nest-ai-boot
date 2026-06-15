import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserRoleService } from '@/modules/user/user-role/user-role.service'
import { SysMenuEntity } from './entities/menu.entity'

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
    let permission: string[] = []
    const roleIds = await this.userRoleService.getRoleIdsByUser(uid)
    permission = await this.getMenusByRoleIds(roleIds)
    return permission
  }

  async getMenusByRoleIds(roleIds: string[]): Promise<string[]> {
    if (!roleIds.length)
      return []

    const rows = await this.menuRepository
      .createQueryBuilder('menu')
      .select('menu.permission', 'permission')
      .innerJoin('menu.roles', 'role')
      .where('role.id IN (:...roleIds)', { roleIds })
      .andWhere('menu.permission IS NOT NULL')
      .getRawMany<{ permission: string }>()

    return [
      ...new Set(
        rows
          .flatMap(r => r.permission?.split(',') ?? [])
          .map(p => p.trim())
          .filter(Boolean),
      ),
    ]
  }
}
