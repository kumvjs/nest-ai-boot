import type { Relation } from 'typeorm'
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger'
import { Column, Entity, OneToMany } from 'typeorm'
import { CommonEntity } from '@/common/entity/common.entity'
import SysUserRoleEntity from '@/modules/user/entities/user-role.entity'
import SysRoleMenuEntity from './role-menu.entity'

@Entity({ name: 'sys_role' })
export class SysRoleEntity extends CommonEntity {
  @Column({ length: 50, unique: true })
  @ApiProperty({ description: '角色名' })
  name: string

  @Column({ unique: true, comment: '角色标识' })
  @ApiProperty({ description: '角色标识' })
  code: string

  @Column({ nullable: true })
  @ApiProperty({ description: '角色描述' })
  remark: string

  @Column({ default: false })
  @ApiProperty({ description: '状态：1启用，0禁用' })
  status: boolean

  @Column({ default: false })
  @ApiProperty({ description: '是否默认用户' })
  default: boolean

  @ApiHideProperty()
  @OneToMany(() => SysUserRoleEntity, ur => ur.role, {
    onDelete: 'CASCADE',
  })
  userRoles: Relation<SysUserRoleEntity[]>

  @ApiHideProperty()
  @OneToMany(() => SysRoleMenuEntity, rm => rm.role, { onDelete: 'CASCADE' })
  roleMenus: Relation<SysRoleMenuEntity[]>
}
