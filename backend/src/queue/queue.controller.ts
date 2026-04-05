import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { InviteToRoomDto, UpdateFairnessDto } from './dto/queue.dto';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  // GET /queue?roomId=xxx&date=2024-04-05
  @Get()
  getQueue(
    @Query('roomId') roomId: string,
    @Query('date') date?: string,
  ) {
    return this.queueService.getQueue(roomId, date);
  }

  // POST /queue/invite — Mời vào phòng
  @Post('invite')
  inviteToRoom(@Body() dto: InviteToRoomDto) {
    return this.queueService.inviteToRoom(dto);
  }

  // POST /queue/:id/done — Bác sĩ bấm Xong
  @Post(':id/done')
  markDone(@Param('id') id: string) {
    return this.queueService.markDone(id);
  }

  // POST /queue/:id/skip — Bỏ qua thủ công
  @Post(':id/skip')
  skip(@Param('id') id: string) {
    return this.queueService.skipEntry(id);
  }

  // PATCH /queue/fairness — Cập nhật điểm F
  @Patch('fairness')
  updateFairness(@Body() dto: UpdateFairnessDto) {
    return this.queueService.updateFairness(dto);
  }
}
