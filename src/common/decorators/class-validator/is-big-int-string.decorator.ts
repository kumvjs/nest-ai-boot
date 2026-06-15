import { applyDecorators } from '@nestjs/common'
import { IsString, Matches, ValidationOptions } from 'class-validator'

export function IsBigIntString(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsString(validationOptions),
    Matches(/^-?\d+$/, {
      message: '$property 必须是 bigint 字符串',
      ...validationOptions,
    }),
  )
}
