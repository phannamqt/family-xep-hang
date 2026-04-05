import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ConfigService } from './config.service';
import {
  CreatePriorityCategoryDto,
  UpdatePriorityCategoryDto,
} from './dto/priority-category.dto';
import { UpdateScoreConfigDto } from './dto/score-config.dto';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  // ===== Priority Categories =====

  @Get('categories')
  findAllCategories() {
    return this.configService.findAllCategories();
  }

  @Get('categories/:id')
  findOneCategory(@Param('id') id: string) {
    return this.configService.findOneCategory(id);
  }

  @Post('categories')
  createCategory(@Body() dto: CreatePriorityCategoryDto) {
    return this.configService.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdatePriorityCategoryDto,
  ) {
    return this.configService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.configService.removeCategory(id);
  }

  // ===== Score Config =====

  @Get('score-settings')
  getScoreConfig() {
    return this.configService.getScoreConfig();
  }

  @Patch('score-settings')
  updateScoreConfig(@Body() dto: UpdateScoreConfigDto) {
    return this.configService.updateScoreConfig(dto);
  }
}
