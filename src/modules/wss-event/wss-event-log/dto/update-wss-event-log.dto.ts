import { PartialType } from '@nestjs/swagger';
import { CreateWssEventLogDto } from './create-wss-event-log.dto';

export class UpdateWssEventLogDto extends PartialType(CreateWssEventLogDto) {}
