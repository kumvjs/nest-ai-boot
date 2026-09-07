import type { VbenMenuResponseDto, VbenRouteRecordDto } from './dto/vben-menu.dto.js'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Not, Repository } from 'typeorm'
import { Roles } from '#/modules/auth/auth.constant.js'
import { UserRoleService } from '#/modules/user/user-role/user-role.service.js'
import { SysMenuEntity } from './entities/menu.entity.js'
import { MenuStatus, MenuType } from './menu.types.js'

interface SortableTreeItem {
  children?: SortableTreeItem[]
  meta?: { order?: number }
  name: string
}

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

  async getAllMenusByUserId(uid: string): Promise<VbenRouteRecordDto[]> {
    const [roleIds, roleCodes] = await Promise.all([
      this.userRoleService.getRoleIdsByUser(uid),
      this.userRoleService.getUserRoleCodes(uid),
    ])

    if (roleCodes.includes(Roles.SUPER)) {
      const menus = await this.getEnabledMenus()
      return this.buildDynamicRoutes(menus, menus.map(menu => menu.id))
    }

    if (!roleIds.length)
      return []

    const [menus, grantedMenuIds] = await Promise.all([
      this.getEnabledMenus(),
      this.getGrantedMenuIdsByRoleIds(roleIds),
    ])

    return this.buildDynamicRoutes(menus, grantedMenuIds)
  }

  async getSystemMenuList(): Promise<VbenMenuResponseDto[]> {
    const menus = await this.menuRepository.find({
      select: {
        authCode: true,
        component: true,
        id: true,
        meta: true,
        name: true,
        path: true,
        pid: true,
        redirect: true,
        status: true,
        type: true,
      },
    })

    return this.buildSystemMenuTree(menus)
  }

  async isMenuNameExists(name: string, editingId?: string): Promise<boolean> {
    return this.menuRepository.existsBy(
      editingId ? { id: Not(editingId), name } : { name },
    )
  }

  async isMenuPathExists(path: string, editingId?: string): Promise<boolean> {
    return this.menuRepository.existsBy(
      editingId ? { id: Not(editingId), path } : { path },
    )
  }

  async getMenusByRoleIds(roleIds: string[]): Promise<string[]> {
    if (!roleIds.length)
      return []

    const rows = await this.menuRepository
      .createQueryBuilder('menu')
      .select('menu.authCode', 'authCode')
      .distinct(true)
      .innerJoin('menu.roleMenus', 'roleMenu')
      .innerJoin('roleMenu.role', 'role')
      .where('roleMenu.roleId IN (:...roleIds)', { roleIds })
      .andWhere('role.status = :roleStatus', { roleStatus: true })
      .andWhere('menu.status = :menuStatus', { menuStatus: MenuStatus.ENABLED })
      .andWhere('menu.type IN (:...permissionTypes)', {
        permissionTypes: [MenuType.MENU, MenuType.BUTTON],
      })
      .andWhere('menu.authCode IS NOT NULL')
      .getRawMany<{ authCode: string }>()

    return this.normalizePermissions(rows)
  }

  async getAllPermissions(): Promise<string[]> {
    const rows = await this.menuRepository
      .createQueryBuilder('menu')
      .select('menu.authCode', 'authCode')
      .where('menu.status = :menuStatus', { menuStatus: MenuStatus.ENABLED })
      .andWhere('menu.type IN (:...permissionTypes)', {
        permissionTypes: [MenuType.MENU, MenuType.BUTTON],
      })
      .andWhere('menu.authCode IS NOT NULL')
      .getRawMany<{ authCode: string }>()

    return this.normalizePermissions(rows)
  }

  private normalizePermissions(rows: Array<{ authCode: string }>): string[] {
    return [...new Set(
      rows
        .map(row => typeof row.authCode === 'string' ? row.authCode.trim() : '')
        .filter(Boolean),
    )].sort()
  }

  private async getEnabledMenus(): Promise<SysMenuEntity[]> {
    return this.menuRepository.find({
      select: {
        component: true,
        id: true,
        meta: true,
        name: true,
        path: true,
        pid: true,
        redirect: true,
        type: true,
      },
      where: { status: MenuStatus.ENABLED },
    })
  }

  private async getGrantedMenuIdsByRoleIds(roleIds: string[]): Promise<string[]> {
    const rows = await this.menuRepository
      .createQueryBuilder('menu')
      .select('menu.id', 'id')
      .distinct(true)
      .innerJoin('menu.roleMenus', 'roleMenu')
      .innerJoin('roleMenu.role', 'role')
      .where('roleMenu.roleId IN (:...roleIds)', { roleIds })
      .andWhere('role.status = :roleStatus', { roleStatus: true })
      .andWhere('menu.status = :menuStatus', { menuStatus: MenuStatus.ENABLED })
      .getRawMany<{ id: string }>()

    return rows.map(row => String(row.id))
  }

  private buildDynamicRoutes(
    menus: SysMenuEntity[],
    grantedMenuIds: string[],
  ): VbenRouteRecordDto[] {
    const menuById = new Map(menus.map(menu => [String(menu.id), menu]))
    const includedIds = new Set<string>()

    for (const grantedId of grantedMenuIds) {
      const branch: SysMenuEntity[] = []
      const visitedIds = new Set<string>()
      let current = menuById.get(String(grantedId))
      let hasEnabledRoot = false

      while (current) {
        const currentId = String(current.id)
        if (visitedIds.has(currentId))
          break

        visitedIds.add(currentId)
        branch.push(current)
        if (!current.pid) {
          hasEnabledRoot = true
          break
        }
        current = menuById.get(String(current.pid))
      }

      if (hasEnabledRoot) {
        for (const menu of branch)
          includedIds.add(String(menu.id))
      }
    }

    const routeByMenuId = new Map<string, VbenRouteRecordDto>()
    for (const menuId of includedIds) {
      const menu = menuById.get(menuId)
      if (!menu || menu.type === MenuType.BUTTON || !menu.path)
        continue

      const route: VbenRouteRecordDto = {
        meta: { ...menu.meta },
        name: menu.name,
        path: menu.path,
      }
      if (menu.component)
        route.component = menu.component
      if (menu.redirect)
        route.redirect = menu.redirect

      routeByMenuId.set(menuId, route)
    }

    const roots: VbenRouteRecordDto[] = []
    for (const [menuId, route] of routeByMenuId) {
      const menu = menuById.get(menuId)!
      if (!menu.pid) {
        roots.push(route)
        continue
      }

      const parentRoute = routeByMenuId.get(String(menu.pid))
      if (parentRoute)
        (parentRoute.children ??= []).push(route)
    }

    this.sortTree(roots)
    return roots
  }

  private buildSystemMenuTree(menus: SysMenuEntity[]): VbenMenuResponseDto[] {
    const menuById = new Map(menus.map(menu => [String(menu.id), menu]))
    const normalizedParentIds = new Map<string, string | null>()

    for (const menu of menus) {
      const menuId = String(menu.id)
      const parentId = menu.pid ? String(menu.pid) : null
      normalizedParentIds.set(
        menuId,
        parentId && parentId !== menuId && menuById.has(parentId) ? parentId : null,
      )
    }

    const completedIds = new Set<string>()
    for (const startId of menuById.keys()) {
      if (completedIds.has(startId))
        continue

      const path: string[] = []
      const pathPositions = new Map<string, number>()
      let currentId: string | null = startId

      while (currentId && !completedIds.has(currentId)) {
        const cycleStart = pathPositions.get(currentId)
        if (cycleStart !== undefined) {
          const cycleIds = path.slice(cycleStart)
          const anchorId = [...cycleIds].sort((leftId, rightId) => {
            const left = menuById.get(leftId)!
            const right = menuById.get(rightId)!
            return this.compareTreeItems(left, right)
          })[0]
          normalizedParentIds.set(anchorId, null)
          break
        }

        pathPositions.set(currentId, path.length)
        path.push(currentId)
        currentId = normalizedParentIds.get(currentId) ?? null
      }

      for (const menuId of path)
        completedIds.add(menuId)
    }

    const nodeById = new Map<string, VbenMenuResponseDto>()
    for (const menu of menus) {
      const menuId = String(menu.id)
      const parentId = normalizedParentIds.get(menuId) ?? null
      const node: VbenMenuResponseDto = {
        id: menuId,
        meta: { ...menu.meta },
        name: menu.name,
        status: menu.status,
        type: menu.type,
      }
      if (typeof menu.meta.activePath === 'string' && menu.meta.activePath)
        node.activePath = menu.meta.activePath
      if (parentId)
        node.pid = parentId
      if (menu.authCode)
        node.authCode = menu.authCode
      if (menu.component)
        node.component = menu.component
      if (menu.path)
        node.path = menu.path
      if (menu.redirect)
        node.redirect = menu.redirect

      nodeById.set(menuId, node)
    }

    const roots: VbenMenuResponseDto[] = []
    for (const [menuId, node] of nodeById) {
      const parentId = normalizedParentIds.get(menuId)
      const parent = parentId ? nodeById.get(parentId) : undefined
      if (parent)
        (parent.children ??= []).push(node)
      else
        roots.push(node)
    }

    this.sortTree(roots)
    return roots
  }

  private sortTree(items: SortableTreeItem[]): void {
    items.sort((left, right) => this.compareTreeItems(left, right))

    for (const item of items) {
      if (item.children)
        this.sortTree(item.children)
    }
  }

  private compareTreeItems(
    left: SortableTreeItem,
    right: SortableTreeItem,
  ): number {
    const leftOrder = typeof left.meta?.order === 'number' ? left.meta.order : 0
    const rightOrder = typeof right.meta?.order === 'number' ? right.meta.order : 0
    if (leftOrder !== rightOrder)
      return leftOrder - rightOrder
    if (left.name === right.name)
      return 0
    return left.name < right.name ? -1 : 1
  }
}
