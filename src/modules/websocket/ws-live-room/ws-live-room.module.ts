import { Module } from '@nestjs/common'
import { AuthModule } from '@/modules/auth/auth.module'
import { UserModule } from '@/modules/user/user.module'
import { WsServerModule } from '../ws-server/ws-server.module'
import { WsSessionModule } from '../ws-session/ws-session.module'
import { WsLiveRoomGateway } from './ws-live-room.gateway'
import { WsLiveRoomService } from './ws-live-room.service'

@Module({
  imports: [AuthModule, WsSessionModule, WsServerModule, UserModule],
  providers: [WsLiveRoomGateway, WsLiveRoomService],
})
export class WsLiveRoomModule { }
