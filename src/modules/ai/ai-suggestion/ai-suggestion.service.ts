import { Injectable } from '@nestjs/common';
import { CreateAiSuggestionDto } from './dto/create-ai-suggestion.dto';
import { UpdateAiSuggestionDto } from './dto/update-ai-suggestion.dto';

@Injectable()
export class AiSuggestionService {
  create(createAiSuggestionDto: CreateAiSuggestionDto) {
    return 'This action adds a new aiSuggestion';
  }

  findAll() {
    return `This action returns all aiSuggestion`;
  }

  findOne(id: number) {
    return `This action returns a #${id} aiSuggestion`;
  }

  update(id: number, updateAiSuggestionDto: UpdateAiSuggestionDto) {
    return `This action updates a #${id} aiSuggestion`;
  }

  remove(id: number) {
    return `This action removes a #${id} aiSuggestion`;
  }
}
