import type { NominalWsRoomKey, WsRoomKey } from './index'
import { WS_NS } from '../ws-ns.constants'

export type AnchorPromptKey = NominalWsRoomKey<'AnchorPromptKey'>
export type HostPromptKey = NominalWsRoomKey<'HostPromptKey'>

// 所有 LiveRoom key 的联合类型，用于需要接受任意 key 的场景
export type WsLiveRoomKey = AnchorPromptKey | HostPromptKey

const WS_LIVE_ROOM_KEY_PREFIX = `${WS_NS.LIVE_ROOM}` as const

export const wsLiveRoomKeys = {
  anchorPromptKey: (roomId: string): AnchorPromptKey => `${WS_LIVE_ROOM_KEY_PREFIX}:anchor:${roomId}` as AnchorPromptKey, // 房间主播提示牌监听用户
  hostPromptKey: (roomId: string): HostPromptKey => `${WS_LIVE_ROOM_KEY_PREFIX}:host:${roomId}` as HostPromptKey, // 房间主持提示牌监听用户

} as const
