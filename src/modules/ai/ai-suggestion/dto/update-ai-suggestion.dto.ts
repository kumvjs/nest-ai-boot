import { PartialType } from '@nestjs/swagger';
import { CreateAiSuggestionDto } from './create-ai-suggestion.dto';

export class UpdateAiSuggestionDto extends PartialType(CreateAiSuggestionDto) {}
