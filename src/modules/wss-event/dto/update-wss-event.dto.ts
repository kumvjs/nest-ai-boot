import { PartialType } from '@nestjs/swagger';
import { CreateWssEventDto } from './create-wss-event.dto';

export class UpdateWssEventDto extends PartialType(CreateWssEventDto) {}
