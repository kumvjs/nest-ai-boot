import { LiveRoomEntity } from '@/modules/live-room/entities/live-room.entity'

const ROOM_KEY_PREFIX = 'room' as const

export const roomKeys = {
  infoByRoomId: (roomId: string): CacheKey<LiveRoomEntity> => `${ROOM_KEY_PREFIX}:info:${roomId}` as const,
} as const
