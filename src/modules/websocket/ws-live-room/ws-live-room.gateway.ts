import { Logger, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Namespace, Socket } from 'socket.io'
import { TokenService } from '@/modules/auth/services/token.service'
import { wsLiveRoomKeys } from '../common/constants/room-keys'
import { WS_NS } from '../common/constants/ws-ns.constants'
import { BaseRbacGateway } from '../gateways/base.gateway'
import { WsServerService } from '../ws-server/ws-server.service'
import { WsSessionService } from '../ws-session/ws-session.service'
import { JoinAnchorPromptDto, JoinHostPromptDto } from './dto/live-room.dto'

@WebSocketGateway({ cors: { origin: '*', credentials: true }, namespace: '/live-room' })
export class WsLiveRoomGateway extends BaseRbacGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Namespace

  protected readonly logger = new Logger(WsLiveRoomGateway.name)

  constructor(
    protected readonly wsSession: WsSessionService,
    protected readonly wsServer: WsServerService,
    protected readonly jwtService: JwtService,
    protected readonly tokenService: TokenService,
  ) {
    super(WS_NS.LIVE_ROOM, wsSession, wsServer, tokenService)
  }

  // 主播加入主播提示屏专属房间
  @SubscribeMessage('joinAnchorPrompt')
  joinAnchorPrompt(
    @MessageBody() dto: JoinAnchorPromptDto,
    @ConnectedSocket() client: Socket,
  ) {
    this.joinRoom(client, wsLiveRoomKeys.anchorPromptKey(dto.id))
  }

  // 主持人加入主持提示屏专属房间
  @SubscribeMessage('joinHostPrompt')
  handleJoinHostPrompt(
    @MessageBody() dto: JoinHostPromptDto,
    @ConnectedSocket() client: Socket,
  ) {
    this.joinRoom(client, wsLiveRoomKeys.hostPromptKey(dto.id))
  }
}
