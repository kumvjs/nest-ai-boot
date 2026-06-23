import { applyDecorators } from '@nestjs/common'
import { Transform } from 'class-transformer'
import { IsString, Matches, ValidationOptions } from 'class-validator'

export function IsBigIntString(validationOptions?: ValidationOptions) {
  return applyDecorators(
    // 先用 Transform 将 number 转成 string
    Transform(({ value }) => {
      return String(value)
    }),
    IsString({ message: '$property 必须是 bigint 字符串', ...validationOptions }),
    Matches(/^-?\d+$/, {
      message: '$property 必须是 bigint 全数字字符串',
      ...validationOptions,
    }),
  )
}
