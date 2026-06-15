import { WS_NS } from '../ws-ns.constants'

const WS_LIVE_ROOM_EVENT_PREFIX = `${WS_NS.LIVE_ROOM}` as const
export const wsLiveRoomEvent = {
  ROOM_CLOSED: `${WS_LIVE_ROOM_EVENT_PREFIX}:room:closed`,
  ROOM_ANCHOR_PROMPT: `${WS_LIVE_ROOM_EVENT_PREFIX}:room:anchorPrompt`,
  ROOM_HOST_PROMPT: `${WS_LIVE_ROOM_EVENT_PREFIX}:room:hostPrompt`,
} as const

export type WsLiveRoomEvent = typeof wsLiveRoomEvent[keyof typeof wsLiveRoomEvent]
