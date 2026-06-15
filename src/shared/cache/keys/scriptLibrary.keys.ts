import { ScriptLibraryEntity } from '@/modules/script-library/entities/script-library.entity'

const SCRIPT_LIB_KEY_PREFIX = 'room' as const

export const scriptLibKeys = {
  info: (id: string): CacheKey<ScriptLibraryEntity> => `${SCRIPT_LIB_KEY_PREFIX}:info:${id}`,
} as const
