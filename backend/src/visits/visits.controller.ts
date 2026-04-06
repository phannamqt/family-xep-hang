import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { VisitsService } from './visits.service';
import { CreateVisitDto, CheckInDto, UpdateVisitCategoriesDto, UpdateVisitDto } from './dto/visit.dto';

@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get()
  findAll(@Query('date') date?: string) {
    return this.visitsService.findAll(date);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visitsService.findOne(id);
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.visitsService.findByCode(code);
  }

  @Post()
  create(@Body() dto: CreateVisitDto) {
    return this.visitsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVisitDto) {
    return this.visitsService.update(id, dto);
  }

  @Patch(':id/categories')
  updateCategories(@Param('id') id: string, @Body() dto: UpdateVisitCategoriesDto) {
    return this.visitsService.updateCategories(id, dto);
  }

  @Post('checkin')
  checkIn(@Body() dto: CheckInDto) {
    return this.visitsService.checkIn(dto);
  }
}
