import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'
import { JoinRoomDto, JoinRoomResDto } from '../../dto/ws.dto'

export class JoinAnchorPromptDto extends JoinRoomDto {
  @ApiProperty()
  @IsString()
  declare id: string
}

export class JoinHostPromptDto extends JoinRoomDto {
  @ApiProperty()
  @IsString()
  declare id: string
}

export class JoinAnchorPromptResDto extends JoinRoomResDto {
  @ApiProperty({ example: 'joined' })
  declare event: string

  @ApiProperty({ type: () => JoinAnchorPromptDto })
  declare data: JoinAnchorPromptDto
}
