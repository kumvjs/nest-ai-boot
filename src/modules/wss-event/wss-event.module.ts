import { Module } from '@nestjs/common'
import { WssEventLogModule } from './wss-event-log/wss-event-log.module'
import { WssEventController } from './wss-event.controller'
import { WssEventService } from './wss-event.service'

@Module({
  controllers: [WssEventController],
  providers: [WssEventService],
  imports: [WssEventLogModule],
})
export class WssEventModule { }
