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
import { CreateVisitDto, CheckInDto, UpdateVisitCategoryDto } from './dto/visit.dto';

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

  // Thay đổi đối tượng → trigger tính lại điểm (qua QueueService)
  @Patch(':id/category')
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateVisitCategoryDto,
  ) {
    return this.visitsService.updateCategory(id, dto);
  }

  // Check-in: nhập Visit ID, chọn loại khám mới hay trả kết quả
  @Post('checkin')
  checkIn(@Body() dto: CheckInDto) {
    return this.visitsService.checkIn(dto);
  }
}
