import { WsLiveRoomEvent } from './live-room.events'

export * from './live-room.events'

// 全局联合类型，emitToRoom 等底层方法用这个
export type WsEvent = WsLiveRoomEvent
