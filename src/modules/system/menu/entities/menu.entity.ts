import type { Relation } from 'typeorm'
import { Column, Entity, ManyToMany, OneToMany } from 'typeorm'
import { CommonEntity } from '@/common/entity/common.entity'
import SysRoleMenu from '../../role/entities/role-menu.entity'
import { SysRoleEntity } from '../../role/entities/role.entity'

export enum MenuType {
  CATALOG = 0,
  MENU = 1,
  BUTTON = 2,
}
@Entity({ name: 'sys_menu' })
export class SysMenuEntity extends CommonEntity {
  @Column({ name: 'parent_id', nullable: true })
  parentId: number

  @Column()
  name: string

  @Column({ nullable: true })
  path: string

  @Column({ nullable: true })
  permission: string

  @Column({ type: 'smallint', default: MenuType.MENU })
  type: MenuType

  @Column({ nullable: true, default: '' })
  icon: string

  @Column({ name: 'order_no', type: 'int', nullable: true, default: 0 })
  orderNo: number

  @Column({ name: 'component', nullable: true })
  component: string

  @Column({ name: 'is_ext', type: 'boolean', default: false })
  isExt: boolean

  @Column({ name: 'ext_open_mode', type: 'boolean', default: true })
  extOpenMode: boolean

  @Column({ name: 'keep_alive', type: 'boolean', default: true })
  keepAlive: boolean

  @Column({ type: 'boolean', default: true })
  show: boolean

  @Column({ name: 'active_menu', nullable: true })
  activeMenu: string

  @Column({ type: 'boolean', default: true })
  status: boolean

  @OneToMany(() => SysRoleMenu, rm => rm.menu, { onDelete: 'CASCADE' })
  roleMenus: Relation<SysRoleMenu[]>
}
