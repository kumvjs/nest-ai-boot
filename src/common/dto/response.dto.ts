import { applyDecorators, Type } from '@nestjs/common'
import { ApiExtraModels, ApiOkResponse, ApiProperty, getSchemaPath } from '@nestjs/swagger'
import { ERROR_CODES } from '../constants/error-code.constant'

// 1. 统一响应基础类
export class ResOp<T = any> {
  @ApiProperty({ default: ERROR_CODES.SUCCESS.code })
  code: number

  @ApiProperty()
  data: any

  @ApiProperty({ default: ERROR_CODES.SUCCESS.message })
  message: string

  @ApiProperty({ default: true })
  success: boolean

  @ApiProperty({ default: '' })
  traceId?: string = ''

  constructor(
    code: number,
    data: any,
    message: string = ERROR_CODES.SUCCESS.message,
    success = true,
    traceId = '',
  ) {
    this.code = code
    this.data = data
    this.message = message
    this.success = success
    this.traceId = traceId
  }

  static success<T>(data?: T, message?: string, traceId = '') {
    return new ResOp(
      ERROR_CODES.SUCCESS.code,
      data,
      message ?? ERROR_CODES.SUCCESS.message,
      true,
      traceId,
    )
  }

  static error(code: number, message?: string, traceId = '') {
    return new ResOp<null>(code, null, message, false, traceId)
  }
}

// 2. 分页相关 DTO
export class Pagination {
  @ApiProperty({ description: '总条数' })
  total: number
}

export class ResultDataAndTotalDto<T> extends Pagination {
  @ApiProperty({ description: '列表数据', items: {} })
  data: T[]
}

// 3. 装饰器参数接口定义
export interface ApiResultOptions<TModel extends Type<any>> {
  /** 具体的 DTO / Entity 实体，或者是基础类型构造函数 (String, Number, Boolean) */
  type?: TModel | [TModel]
  /** 是否为分页列表，默认为 false */
  isPage?: boolean
  /** 接口描述 */
  description?: string
}
