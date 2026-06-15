import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm'

import { CommonEntity } from '@/common/entity/common.entity'
import { SysUserEntity } from '@/modules/user/entities/user.entity'

@Entity('user_refresh_tokens')
export class RefreshTokenEntity extends CommonEntity {
  @Column({ length: 500 })
  value!: string

  @Column({ comment: '令牌过期时间' })
  expired_at!: Date

  @Column({ name: 'user_id' })
  userId!: string

  @ManyToOne(() => SysUserEntity, user => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user?: SysUserEntity
}
