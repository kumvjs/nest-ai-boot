import type { Relation } from 'typeorm'
import type { MenuMeta } from '../menu.types.js'
import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { CommonEntity } from '#/common/entity/common.entity.js'
import SysRoleMenu from '../../role/entities/role-menu.entity.js'
import { MenuStatus, MenuType } from '../menu.types.js'

@Entity({ name: 'sys_menu' })
@Check('chk_sys_menu_type', `"type" IN ('catalog', 'menu', 'embedded', 'link', 'button')`)
@Check('chk_sys_menu_status', '"status" IN (0, 1)')
export class SysMenuEntity extends CommonEntity {
  @Column({ type: 'bigint', nullable: true })
  @Index('idx_sys_menu_pid')
  pid?: string | null

  @ManyToOne(() => SysMenuEntity, menu => menu.children, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'pid' })
  parent?: Relation<SysMenuEntity> | null

  @OneToMany(() => SysMenuEntity, menu => menu.parent)
  children: Relation<SysMenuEntity[]>

  @Column({ length: 30 })
  @Index('uq_sys_menu_name', { unique: true })
  name: string

  @Column({ length: 100, nullable: true })
  @Index('uq_sys_menu_path', { unique: true })
  path?: string | null

  @Column({ name: 'auth_code', length: 255, nullable: true })
  @Index('uq_sys_menu_auth_code', { unique: true })
  authCode?: string | null

  @Column({ length: 20, type: 'varchar', default: MenuType.MENU })
  @Index('idx_sys_menu_type')
  type: MenuType

  @Column({ length: 255, nullable: true })
  component?: string | null

  @Column({ length: 100, nullable: true })
  redirect?: string | null

  @Column({ default: () => '\'{}\'::jsonb', type: 'jsonb' })
  meta: MenuMeta

  @Column({ type: 'smallint', default: MenuStatus.ENABLED })
  @Index('idx_sys_menu_status')
  status: MenuStatus

  @OneToMany(() => SysRoleMenu, rm => rm.menu, { onDelete: 'CASCADE' })
  roleMenus: Relation<SysRoleMenu[]>
}
