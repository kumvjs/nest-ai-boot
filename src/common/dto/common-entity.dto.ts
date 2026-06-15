import { ApiProperty } from '@nestjs/swagger'
import { IsOptional } from 'class-validator'
import { IsBigIntString } from '../decorators/class-validator/is-big-int-string.decorator'

export abstract class CommonEntityDto {
  @ApiProperty({ description: 'id' })
  @IsBigIntString()
  @IsOptional()
  id?: string

  @ApiProperty({ description: '创建时间' })
  createdAt!: Date

  @ApiProperty({ description: '更新时间' })
  updatedAt!: Date

  @ApiProperty({ type: Date, description: '删除时间' })
  deletedAt?: Date | null

  @ApiProperty({ type: String, description: '创建人' })
  createdBy?: string | null

  @ApiProperty({ type: String, description: '更新人' })
  updatedBy?: string | null
}
