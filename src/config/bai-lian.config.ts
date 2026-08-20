import { ConfigType, registerAs } from '@nestjs/config'

export const baiLianToken = 'bailian'

export const BAI_LIAN_CONFIG = registerAs(baiLianToken, () => ({
  workSpaceId: process.env.BAILIAN_WORK_SPACE_ID!,
  apiKey: process.env.BAILIAN_DASHSCOPE_API_KEY!,
  model: process.env.BAILIAN_MODEL!,
}))

export type BaiLianConfig = ConfigType<typeof BAI_LIAN_CONFIG>
