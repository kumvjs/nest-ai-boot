import { Module } from '@nestjs/common'
import { WsSessionService } from './ws-session.service'

@Module({
  controllers: [],
  providers: [WsSessionService],
  exports: [WsSessionService],
})
export class WsSessionModule {}
