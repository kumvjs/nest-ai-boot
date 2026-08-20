import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WssEventLogEntity } from './entities/wss-event-log.entity'
import { WssEventLogController } from './wss-event-log.controller'
import { WssEventLogService } from './wss-event-log.service'

@Module({
  imports: [TypeOrmModule.forFeature([WssEventLogEntity])],
  controllers: [WssEventLogController],
  providers: [WssEventLogService],
  exports: [WssEventLogService],
})
export class WssEventLogModule { }
