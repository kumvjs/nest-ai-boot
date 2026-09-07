import { getMetadataArgsStorage } from 'typeorm'
import { MenuStatus, MenuType } from '../menu.types.js'
import { SysMenuEntity } from './menu.entity.js'

describe('sys menu entity', () => {
  it('persists only stable Vben fields plus JSONB metadata', () => {
    const columns = getMetadataArgsStorage().columns.filter(column => column.target === SysMenuEntity).map(column => column.propertyName)

    expect(columns).toEqual(expect.arrayContaining([
      'authCode',
      'component',
      'meta',
      'name',
      'pid',
      'path',
      'redirect',
      'status',
      'type',
    ]))
    expect(columns).not.toEqual(expect.arrayContaining([
      'activeMenu',
      'extOpenMode',
      'icon',
      'isExt',
      'keepAlive',
      'orderNo',
      'parentId',
      'permission',
      'show',
    ]))
  })

  it('uses the five stable Vben menu types', () => {
    expect(Object.values(MenuType)).toEqual([
      'button',
      'catalog',
      'embedded',
      'link',
      'menu',
    ])
    expect(MenuStatus).toMatchObject({ DISABLED: 0, ENABLED: 1 })
  })

  it('enforces Vben value ranges, uniqueness, and restrictive parent deletion', () => {
    const storage = getMetadataArgsStorage()
    const checkNames = storage.checks
      .filter(check => check.target === SysMenuEntity)
      .map(check => check.name)
    const uniqueIndexNames = storage.indices
      .filter(index => index.target === SysMenuEntity && index.unique)
      .map(index => index.name)
    const parentRelation = storage.relations.find(
      relation => relation.target === SysMenuEntity && relation.propertyName === 'parent',
    )

    expect(checkNames).toEqual(expect.arrayContaining([
      'chk_sys_menu_status',
      'chk_sys_menu_type',
    ]))
    expect(uniqueIndexNames).toEqual(expect.arrayContaining([
      'uq_sys_menu_auth_code',
      'uq_sys_menu_name',
      'uq_sys_menu_path',
    ]))
    expect(parentRelation?.options).toMatchObject({ onDelete: 'RESTRICT' })
  })
})
