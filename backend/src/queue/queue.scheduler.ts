import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { format } from 'date-fns';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueueEntry, QueueStatus } from './entities/queue-entry.entity';

@Injectable()
export class QueueScheduler {
  private readonly logger = new Logger(QueueScheduler.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly queueGateway: QueueGateway,
    @InjectRepository(QueueEntry)
    private readonly entryRepo: Repository<QueueEntry>,
  ) {}

  // Mỗi phút: tính lại T(t) cho tất cả phòng đang có bệnh nhân chờ
  @Cron(CronExpression.EVERY_MINUTE)
  async recalculateScores() {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      const activeRooms = await this.entryRepo
        .createQueryBuilder('entry')
        .leftJoin('entry.visit', 'visit')
        .select('DISTINCT visit."room_id"', 'roomId')
        .where('visit."visitDate" = :date', { date: today })
        .andWhere('entry.status = :status', { status: QueueStatus.WAITING })
        .getRawMany();

      for (const { roomId } of activeRooms) {
        await this.queueService.recalculateQueue(roomId, today);
        // Push socket update tới client
        await this.queueGateway.emitQueueUpdate(roomId, today);
      }

      if (activeRooms.length > 0) {
        this.logger.log(`Recalculated ${activeRooms.length} active queue(s)`);
      }
    } catch (err) {
      this.logger.error('Error recalculating scores', err);
    }
  }
}
