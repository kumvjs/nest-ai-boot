import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBigIntString } from '../decorators/class-validator/is-big-int-string.decorator'

export abstract class CommonEntityIdDto {
  @ApiProperty({ description: 'id' })
  @Type(() => String)
  @IsBigIntString()
  id!: string
}
