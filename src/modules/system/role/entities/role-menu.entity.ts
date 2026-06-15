import type { Relation } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { CommonEntity } from '@/common/entity/common.entity'
import { SysMenuEntity } from '../../menu/entities/menu.entity'
import { SysRoleEntity } from './role.entity'

@Entity({ name: 'sys_role_menus' })
export default class SysRoleMenuEntity extends CommonEntity {
  @Column({ name: 'role_id' })
  @ApiProperty()
  roleId: string

  @ManyToOne(() => SysRoleEntity, role => role.roleMenus)
  @JoinColumn({ name: 'role_id' })
  role: Relation<SysRoleEntity>

  @Column({ name: 'menu_id' })
  @ApiProperty()
  menuId: string

  @ManyToOne(() => SysMenuEntity, menu => menu.roleMenus)
  @JoinColumn({ name: 'menu_id' })
  menu: Relation<SysMenuEntity>
}
