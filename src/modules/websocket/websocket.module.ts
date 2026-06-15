import { Module } from '@nestjs/common'
import { WsInterceptor } from './interceptors/ws.interceptor'
import { WsLiveRoomModule } from './ws-live-room/ws-live-room.module'
import { WsPushModule } from './ws-push/ws-push.module'
import { WsServerModule } from './ws-server/ws-server.module'
import { WsSessionModule } from './ws-session/ws-session.module'

@Module({
  imports: [WsSessionModule, WsServerModule, WsPushModule, WsLiveRoomModule],
  providers: [WsInterceptor],
  exports: [WsInterceptor],
})
export class WebsocketModule {}
