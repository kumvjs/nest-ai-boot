import type { Relation } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm'
import { CommonEntity } from '@/common/entity/common.entity'
import { SysRoleEntity } from '@/modules/system/role/entities/role.entity'
import { SysUserEntity } from './user.entity'

@Entity({ name: 'sys_user_role' })
@Unique(['userId', 'roleId'])
export default class SysUserRoleEntity extends CommonEntity {
  @Column({ type: 'bigint', name: 'user_id' })
  @Index()
  @ApiProperty()
  userId: string

  @ManyToOne(() => SysUserEntity, user => user.userRoles)
  @JoinColumn({ name: 'user_id' })
  user: Relation<SysUserEntity>

  @Column({ type: 'bigint', name: 'role_id' })
  @Index()
  @ApiProperty()
  roleId: string

  @ManyToOne(() => SysRoleEntity, role => role.userRoles)
  @JoinColumn({ name: 'role_id' })
  role: Relation<SysRoleEntity>
}
