import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, Index } from 'typeorm'
import { CommonEntity } from '@/common/entity/common.entity'

@Entity({ name: 'ai_suggestions', comment: 'AI输出记录表' })
@Index('idx_ai_room_time', ['room_id', 'createdAt'])
export class AiSuggestionEntity extends CommonEntity {
  @Column({ length: 50 })
  @ApiProperty({ description: '直播间编号' })
  room_id!: string

  @Column({ type: 'bigint' })
  @Index('idx_ai_event')
  @ApiProperty({ description: '对应触发记录ID' })
  event_id!: string

  @Column({ length: 50 })
  @ApiProperty({ description: '触发按钮' })
  trigger_button!: string

  @Column({ type: 'text' })
  @ApiProperty({ description: 'AI返回主持话术' })
  host_script!: string

  @Column({ type: 'text' })
  @ApiProperty({ description: '备用话术' })
  backup_script!: string

  @Column({ type: 'text' })
  @ApiProperty({ description: '主播动作' })
  anchor_action!: string

  @Column({ type: 'text' })
  @ApiProperty({ description: '运营指令' })
  operator_instruction!: string

  @Column({ type: 'text' })
  @ApiProperty({ description: '风险提醒' })
  risk_warning!: string

  @Column({ length: 100 })
  @ApiProperty({ description: '模型供应商，如aliyun/deepseek' })
  model_provider!: string

  @Column({ length: 100 })
  @ApiProperty({ description: '模型名称，如qwen-plus' })
  model_name!: string

  @Column({ type: 'int' })
  @ApiProperty({ description: '耗时毫秒' })
  duration_ms!: number

  @Column({ default: true })
  @ApiProperty({ description: '是否成功：1成功，0失败' })
  success!: boolean

  @Column({ type: 'text' })
  @ApiProperty({ description: '失败原因' })
  error_message!: string
}
