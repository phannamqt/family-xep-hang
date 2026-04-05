import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueEntry } from './entities/queue-entry.entity';
import { Visit } from '../visits/entities/visit.entity';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { QueueScheduler } from './queue.scheduler';
import { ScoreService } from './score.service';
import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QueueEntry, Visit]),
    AppConfigModule,
  ],
  controllers: [QueueController],
  providers: [QueueService, QueueGateway, QueueScheduler, ScoreService],
  exports: [QueueService, QueueGateway],
})
export class QueueModule {}
