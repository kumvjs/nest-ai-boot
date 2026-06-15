import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, Index } from 'typeorm'
import { CommonEntity } from '@/common/entity/common.entity'

@Entity({ name: 'operation_logs', comment: '操作日志表' })
@Index('idx_logs_user_time', ['user_id', 'createdAt'])
@Index('idx_logs_room_time', ['room_id', 'createdAt'])
export class OperationLogEntity extends CommonEntity {
  @Column({ type: 'bigint', nullable: true })
  @ApiProperty({ description: '用户ID' })
  user_id?: string

  @Column({ length: 100, nullable: true })
  @ApiProperty({ description: '用户账号' })
  username?: string

  @Column({ length: 50, nullable: true })
  @ApiProperty({ description: '用户角色' })
  role?: string

  @Column({ length: 50, nullable: true })
  @ApiProperty({ description: '直播间编号' })
  room_id?: string

  @Column({ length: 100, default: '' })
  @Index('idx_logs_action')
  @ApiProperty({ description: '操作类型' })
  action_type!: string

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '操作详情' })
  action_detail?: string

  @Column({ length: 100, nullable: true })
  @ApiProperty({ description: '操作IP' })
  ip?: string
}
