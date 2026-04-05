import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriorityCategory } from './entities/priority-category.entity';
import { ScoreConfig } from './entities/score-config.entity';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';

@Module({
  imports: [TypeOrmModule.forFeature([PriorityCategory, ScoreConfig])],
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class AppConfigModule {}
