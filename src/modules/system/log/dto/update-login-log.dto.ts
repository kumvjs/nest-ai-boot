import { PartialType } from '@nestjs/swagger'
import { CreateLogDto } from './create-login-log.dto'

export class UpdateLogDto extends PartialType(CreateLogDto) {}
