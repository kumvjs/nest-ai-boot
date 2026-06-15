import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AiSuggestionService } from './ai-suggestion.service';
import { CreateAiSuggestionDto } from './dto/create-ai-suggestion.dto';
import { UpdateAiSuggestionDto } from './dto/update-ai-suggestion.dto';

@Controller('ai-suggestion')
export class AiSuggestionController {
  constructor(private readonly aiSuggestionService: AiSuggestionService) {}

  @Post()
  create(@Body() createAiSuggestionDto: CreateAiSuggestionDto) {
    return this.aiSuggestionService.create(createAiSuggestionDto);
  }

  @Get()
  findAll() {
    return this.aiSuggestionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiSuggestionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAiSuggestionDto: UpdateAiSuggestionDto) {
    return this.aiSuggestionService.update(+id, updateAiSuggestionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aiSuggestionService.remove(+id);
  }
}
