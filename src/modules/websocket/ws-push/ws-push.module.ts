import { Module } from '@nestjs/common'
import { WsServerModule } from '../ws-server/ws-server.module'
import { WsSessionModule } from '../ws-session/ws-session.module'
import { WsPushService } from './ws-push.service'

@Module({
  imports: [WsServerModule, WsSessionModule],
  providers: [WsPushService],
  exports: [WsPushService],
})
export class WsPushModule {}
