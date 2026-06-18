import { Type } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { TraceContext } from '@/shared/logger/logger.service'
import { ERROR_CODES } from '../constants/error-code.constant'

interface ResOpType {
  code: number
  data: any
  message?: string
  errors?: string[]
  success: boolean
}

// 1. 统一响应基础类
export class ResOp<T = any> {
  @ApiProperty({ default: ERROR_CODES.SUCCESS.code })
  code: number = ERROR_CODES.SUCCESS.code

  @ApiProperty()
  data: any

  @ApiProperty({ default: ERROR_CODES.SUCCESS.message })
  message: string = ERROR_CODES.SUCCESS.message

  @ApiProperty({ type: Array<string>, required: false })
  errors?: string[]

  @ApiProperty({ default: true })
  success: boolean

  @ApiProperty({ default: '' })
  traceId: string = ''

  constructor(op: ResOpType,
  ) {
    this.code = op.code
    this.data = op.data
    this.message = op?.message || ''
    this.success = op.success
    if (!this.success) {
      this.errors = op?.errors || [this.message]
    }
    const { traceId, userId } = TraceContext.storage.getStore() ?? {}
    this.traceId = traceId || ''
  }

  static success<T>(data?: T, message?: string) {
    return new ResOp({
      code: ERROR_CODES.SUCCESS.code,
      data,
      message: message ?? ERROR_CODES.SUCCESS.message,
      success: true,
    },
    )
  }

  static error(code: number, message?: string, errors?: string[]) {
    return new ResOp<null>({ code, data: null, message, errors, success: false })
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
