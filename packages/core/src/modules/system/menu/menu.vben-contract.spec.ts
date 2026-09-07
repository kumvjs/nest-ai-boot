import type { Repository } from 'typeorm'
import type { UserRoleService } from '#/modules/user/user-role/user-role.service.js'
import { Roles } from '#/modules/auth/auth.constant.js'
import { MenuType, SysMenuEntity } from './entities/menu.entity.js'
import { MenuService } from './menu.service.js'

describe('vben effective permission codes', () => {
  const queryBuilder = {
    andWhere: jest.fn(),
    getRawMany: jest.fn(),
    innerJoin: jest.fn(),
    select: jest.fn(),
    where: jest.fn(),
  }
  const menuRepository = {
    createQueryBuilder: jest.fn(),
  }
  const userRoleService = {
    getRoleIdsByUser: jest.fn(),
    getUserRoleCodes: jest.fn(),
  }
  const service = new MenuService(
    menuRepository as unknown as Repository<SysMenuEntity>,
    userRoleService as unknown as UserRoleService,
  )

  beforeEach(() => {
    jest.clearAllMocks()
    for (const method of ['andWhere', 'innerJoin', 'select', 'where'] as const)
      queryBuilder[method].mockReturnValue(queryBuilder)
    menuRepository.createQueryBuilder.mockReturnValue(queryBuilder)
    queryBuilder.getRawMany.mockResolvedValue([])
    userRoleService.getRoleIdsByUser.mockResolvedValue([])
    userRoleService.getUserRoleCodes.mockResolvedValue([])
  })

  it('returns normalized codes from enabled assigned roles and enabled menu/button records', async () => {
    userRoleService.getRoleIdsByUser.mockResolvedValue(['10', '11'])
    userRoleService.getUserRoleCodes.mockResolvedValue(['admin'])
    queryBuilder.getRawMany.mockResolvedValue([
      { permission: ' system:user:update,system:user:list ' },
      { permission: 'system:user:list,,system:role:list' },
      { permission: '   ' },
    ])

    await expect(service.getPermissionsByUserId('42')).resolves.toEqual([
      'system:role:list',
      'system:user:list',
      'system:user:update',
    ])

    expect(queryBuilder.innerJoin).toHaveBeenCalledWith('menu.roleMenus', 'roleMenu')
    expect(queryBuilder.innerJoin).toHaveBeenCalledWith('roleMenu.role', 'role')
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'roleMenu.roleId IN (:...roleIds)',
      { roleIds: ['10', '11'] },
    )
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'role.status = :roleStatus',
      { roleStatus: true },
    )
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'menu.status = :menuStatus',
      { menuStatus: true },
    )
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'menu.type IN (:...permissionTypes)',
      { permissionTypes: [MenuType.MENU, MenuType.BUTTON] },
    )
  })

  it('returns no permissions without an assigned enabled role', async () => {
    await expect(service.getPermissionsByUserId('42')).resolves.toEqual([])

    expect(menuRepository.createQueryBuilder).not.toHaveBeenCalled()
  })

  it('returns every enabled menu/button code for an enabled super role', async () => {
    userRoleService.getRoleIdsByUser.mockResolvedValue(['1'])
    userRoleService.getUserRoleCodes.mockResolvedValue([Roles.SUPER])
    queryBuilder.getRawMany.mockResolvedValue([
      { permission: 'system:user:list, system:user:update' },
    ])

    await expect(service.getPermissionsByUserId('42')).resolves.toEqual([
      'system:user:list',
      'system:user:update',
    ])

    expect(queryBuilder.innerJoin).not.toHaveBeenCalled()
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'menu.status = :menuStatus',
      { menuStatus: true },
    )
  })
})
