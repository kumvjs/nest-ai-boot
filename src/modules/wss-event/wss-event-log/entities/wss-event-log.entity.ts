import { Entity } from 'typeorm'
import { CommonEntity } from '@/common/entity/common.entity'

export class WssEventLog { }

@Entity({ name: 'wss_event_logs', comment: 'WSS 数据源事件记录表' })
export class WssEventLogEntity extends CommonEntity {
}
