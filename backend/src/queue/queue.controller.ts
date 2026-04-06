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
import { QueueGateway } from './queue.gateway';
import { InviteToRoomDto, UpdateFairnessDto, UpdateQueuedAtDto } from './dto/queue.dto';
import { format } from 'date-fns';

@Controller('queue')
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    private readonly queueGateway: QueueGateway,
  ) {}

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
  async inviteToRoom(@Body() dto: InviteToRoomDto) {
    const entry = await this.queueService.inviteToRoom(dto);
    const date = entry.visit?.visitDate ?? format(new Date(), 'yyyy-MM-dd');
    await this.queueGateway.emitQueueUpdate(entry.roomId ?? '', date);
    return entry;
  }

  // POST /queue/:id/done — Bác sĩ bấm Xong
  @Post(':id/done')
  async markDone(@Param('id') id: string) {
    const entry = await this.queueService.markDone(id);
    const date = entry.visit?.visitDate ?? format(new Date(), 'yyyy-MM-dd');
    await this.queueGateway.emitQueueUpdate(entry.roomId ?? '', date);
    return entry;
  }

  // POST /queue/:id/skip — Bỏ qua thủ công
  @Post(':id/skip')
  async skip(@Param('id') id: string) {
    const entry = await this.queueService.skipEntry(id);
    const date = entry.visit?.visitDate ?? format(new Date(), 'yyyy-MM-dd');
    await this.queueGateway.emitQueueUpdate(entry.roomId ?? '', date);
    return entry;
  }

  // PATCH /queue/fairness — Cập nhật điểm F
  @Patch('fairness')
  async updateFairness(@Body() dto: UpdateFairnessDto) {
    const entry = await this.queueService.updateFairness(dto);
    const date = entry.visit?.visitDate ?? format(new Date(), 'yyyy-MM-dd');
    await this.queueGateway.emitQueueUpdate(entry.roomId ?? '', date);
    return entry;
  }

  // PATCH /queue/queued-at — Cập nhật thời gian bắt đầu chờ
  @Patch('queued-at')
  async updateQueuedAt(@Body() dto: UpdateQueuedAtDto) {
    const entry = await this.queueService.updateQueuedAt(dto);
    const date = entry.visit?.visitDate ?? format(new Date(), 'yyyy-MM-dd');
    await this.queueGateway.emitQueueUpdate(entry.roomId ?? '', date);
    return entry;
  }
}
