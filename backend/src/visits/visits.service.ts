import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { format } from 'date-fns';
import { Visit, CheckInType } from './entities/visit.entity';
import { CreateVisitDto, CheckInDto, UpdateVisitCategoryDto } from './dto/visit.dto';
import { QueueService } from '../queue/queue.service';
import { QueueGateway } from '../queue/queue.gateway';

@Injectable()
export class VisitsService {
  constructor(
    @InjectRepository(Visit)
    private readonly visitRepo: Repository<Visit>,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService,
    @Inject(forwardRef(() => QueueGateway))
    private readonly queueGateway: QueueGateway,
  ) {}

  async findAll(date?: string) {
    const query = this.visitRepo
      .createQueryBuilder('visit')
      .leftJoinAndSelect('visit.patient', 'patient')
      .leftJoinAndSelect('visit.category', 'category')
      .leftJoinAndSelect('visit.room', 'room')
      .orderBy('visit.createdAt', 'DESC');

    if (date) {
      query.where('visit.visitDate = :date', { date });
    }
    return query.getMany();
  }

  async findOne(id: string) {
    const visit = await this.visitRepo.findOne({
      where: { id },
      relations: ['patient', 'category', 'room'],
    });
    if (!visit) throw new NotFoundException(`Không tìm thấy lượt khám #${id}`);
    return visit;
  }

  async findByCode(code: string) {
    const visit = await this.visitRepo.findOne({
      where: { visitCode: code },
      relations: ['patient', 'category', 'room'],
    });
    if (!visit) throw new NotFoundException(`Không tìm thấy lượt khám: ${code}`);
    return visit;
  }

  async create(dto: CreateVisitDto) {
    const visitDate = dto.visitDate ?? format(new Date(), 'yyyy-MM-dd');
    const visitCode = await this.generateVisitCode(visitDate);

    const visit = this.visitRepo.create({
      ...dto,
      visitDate,
      visitCode,
      appointmentTime: dto.appointmentTime
        ? new Date(dto.appointmentTime)
        : null,
    });
    return this.visitRepo.save(visit);
  }

  async updateCategory(id: string, dto: UpdateVisitCategoryDto) {
    const visit = await this.findOne(id);
    visit.categoryId = dto.categoryId;
    const saved = await this.visitRepo.save(visit);

    // E3: Thay đổi đối tượng → tính lại điểm P trong queue
    await this.queueService.updatePScore(id, visit.category?.scoreP ?? 0);
    await this.queueGateway.emitQueueUpdate(visit.roomId, visit.visitDate);

    return saved;
  }

  async checkIn(dto: CheckInDto): Promise<Visit> {
    const visit = await this.findByCode(dto.visitCode);

    if (visit.checkInAt) {
      throw new BadRequestException(
        `Lượt khám ${dto.visitCode} đã được check-in lúc ${visit.checkInAt.toLocaleTimeString('vi-VN')}`,
      );
    }

    visit.checkInType = dto.type;
    visit.checkInAt = new Date();
    const saved = await this.visitRepo.save(visit);

    // E1/E2: Đẩy vào queue + emit socket
    const fullVisit = await this.findOne(visit.id);
    await this.queueService.addToQueue(fullVisit);
    await this.queueGateway.emitQueueUpdate(visit.roomId, visit.visitDate);

    return saved;
  }

  private async generateVisitCode(date: string): Promise<string> {
    const count = await this.visitRepo.count({ where: { visitDate: date } });
    const seq = String(count + 1).padStart(3, '0');
    const dateStr = date.replace(/-/g, '');
    return `VK-${dateStr}-${seq}`;
  }
}
