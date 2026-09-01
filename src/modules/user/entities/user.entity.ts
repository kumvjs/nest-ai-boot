import type { Relation } from 'typeorm'
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger'
import { Exclude } from 'class-transformer'
import { Column, Entity, Index, OneToMany } from 'typeorm'
import { CommonEntity } from '#/common/entity/common.entity.js'
import { RefreshTokenEntity } from '#/modules/auth/entities/refresh-token.entity.js'
import { md5 } from '#/utils/index.js'
import SysUserRoleEntity from './user-role.entity.js'

@Entity({ name: 'sys_user' })
export class SysUserEntity extends CommonEntity {
  @Column({ length: 100 })
  @Index('username', { unique: true })
  @ApiProperty({ description: '账号' })
  username!: string

  @Exclude()
  @Column({ length: 255, select: false })
  password_hash!: string

  @Column({ length: 32, select: false })
  @Exclude()
  psalt: string

  @Column({ length: 50 })
  @ApiProperty({ description: '用户角色' })
  role: string

  @Column({ length: 100 })
  @ApiProperty({ description: '昵称' })
  nickname: string

  @Column({
    type: 'boolean',
    default: false,
  })
  @ApiProperty({ description: '启用状态' })
  status: boolean

  @ApiHideProperty()
  @OneToMany(() => SysUserRoleEntity, ur => ur.user, {
    onDelete: 'CASCADE',
  })
  userRoles: Relation<SysUserRoleEntity[]>

  @OneToMany(() => RefreshTokenEntity, (refreshToken: RefreshTokenEntity) => refreshToken.user, {
    cascade: true,
  })
  refreshTokens: Relation<RefreshTokenEntity[]>

  encryptPassword(password: string, psalt: string) {
    return md5(`${password}${psalt}`)
  }

  verifyPassword(password: string) {
    return (
      this.encryptPassword(password, this.psalt)
      === this.password_hash
    )
  }
}
