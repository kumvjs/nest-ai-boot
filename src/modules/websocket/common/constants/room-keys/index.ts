import { WS_NS } from '../ws-ns.constants'

export * from './live-room.keys'
export * from './uid.keys'

export type NominalWsRoomKey<T extends string> = string & { readonly __wsRoomKeyBrand: T }

export type WsRoomKey = NominalWsRoomKey<string>

const WS_ROOM_KEY_PREFIX = 'wsRoom' as const

export const wsRoomKeyGen = (roomId: string): WsRoomKey => `${WS_ROOM_KEY_PREFIX}:${roomId}` as WsRoomKey
