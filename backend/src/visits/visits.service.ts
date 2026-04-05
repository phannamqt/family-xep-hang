import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { format } from 'date-fns';
import { Visit, CheckInType } from './entities/visit.entity';
import { CreateVisitDto, CheckInDto, UpdateVisitCategoriesDto } from './dto/visit.dto';
import { PriorityCategory } from '../config/entities/priority-category.entity';
import { QueueService } from '../queue/queue.service';
import { QueueGateway } from '../queue/queue.gateway';

@Injectable()
export class VisitsService {
  constructor(
    @InjectRepository(Visit)
    private readonly visitRepo: Repository<Visit>,
    @InjectRepository(PriorityCategory)
    private readonly categoryRepo: Repository<PriorityCategory>,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService,
    @Inject(forwardRef(() => QueueGateway))
    private readonly queueGateway: QueueGateway,
  ) {}

  async findAll(date?: string) {
    const query = this.visitRepo
      .createQueryBuilder('visit')
      .leftJoinAndSelect('visit.patient', 'patient')
      .leftJoinAndSelect('visit.room', 'room')
      .orderBy('visit.createdAt', 'DESC');

    if (date) query.where('visit.visitDate = :date', { date });

    const visits = await query.getMany();

    // Gắn categories vào từng visit
    return this.attachCategories(visits);
  }

  async findOne(id: string) {
    const visit = await this.visitRepo.findOne({
      where: { id },
      relations: ['patient', 'room'],
    });
    if (!visit) throw new NotFoundException(`Không tìm thấy lượt khám #${id}`);
    const [enriched] = await this.attachCategories([visit]);
    return enriched;
  }

  async findByCode(code: string) {
    const visit = await this.visitRepo.findOne({
      where: { visitCode: code },
      relations: ['patient', 'room'],
    });
    if (!visit) throw new NotFoundException(`Không tìm thấy lượt khám: ${code}`);
    const [enriched] = await this.attachCategories([visit]);
    return enriched;
  }

  async create(dto: CreateVisitDto) {
    const visitDate = dto.visitDate ?? format(new Date(), 'yyyy-MM-dd');
    const visitCode = await this.generateVisitCode(visitDate);

    const visit = this.visitRepo.create({
      patientId: dto.patientId,
      categoryIds: dto.categoryIds,
      visitDate,
      visitCode,
      appointmentTime: dto.appointmentTime ? new Date(dto.appointmentTime) : null,
    });
    const saved = await this.visitRepo.save(visit);
    return this.findOne(saved.id);
  }

  async updateCategories(id: string, dto: UpdateVisitCategoriesDto) {
    const visit = await this.visitRepo.findOne({ where: { id } });
    if (!visit) throw new NotFoundException(`Không tìm thấy lượt khám #${id}`);

    visit.categoryIds = dto.categoryIds;
    await this.visitRepo.save(visit);

    // Tính lại scoreP và emit socket nếu đã check-in
    if (visit.roomId) {
      const categories = await this.categoryRepo.findBy({ id: In(dto.categoryIds) });
      const newScoreP = categories.reduce((sum, c) => sum + c.scoreP, 0);
      await this.queueService.updatePScore(id, newScoreP);
      await this.queueGateway.emitQueueUpdate(visit.roomId, visit.visitDate);
    }

    return this.findOne(id);
  }

  async checkIn(dto: CheckInDto): Promise<any> {
    const visit = await this.visitRepo.findOne({
      where: { visitCode: dto.visitCode },
      relations: ['patient', 'room'],
    });
    if (!visit) throw new NotFoundException(`Không tìm thấy lượt khám: ${dto.visitCode}`);

    if (visit.checkInAt) {
      throw new BadRequestException(
        `Lượt khám ${dto.visitCode} đã check-in lúc ${new Date(visit.checkInAt).toLocaleTimeString('vi-VN')}`,
      );
    }

    // Gán phòng khám tại thời điểm check-in
    visit.roomId = dto.roomId;
    visit.checkInType = dto.type;
    visit.checkInAt = new Date();
    await this.visitRepo.save(visit);

    // Fetch full visit với categories để tính scoreP
    const fullVisit = await this.visitRepo.findOne({
      where: { id: visit.id },
      relations: ['patient', 'room'],
    });

    const categories = await this.categoryRepo.findBy({ id: In(visit.categoryIds) });
    const scoreP = categories.reduce((sum, c) => sum + c.scoreP, 0);

    // Đẩy vào queue
    await this.queueService.addToQueue(fullVisit, scoreP);
    await this.queueGateway.emitQueueUpdate(dto.roomId, fullVisit.visitDate);

    const [enriched] = await this.attachCategories([fullVisit]);
    return enriched;
  }

  // Gắn danh sách categories vào visits (batch query)
  private async attachCategories(visits: Visit[]) {
    const allIds = [...new Set(visits.flatMap(v => v.categoryIds ?? []))];
    const categories = allIds.length
      ? await this.categoryRepo.findBy({ id: In(allIds) })
      : [];

    const catMap = new Map(categories.map(c => [c.id, c]));

    return visits.map(v => ({
      ...v,
      categories: (v.categoryIds ?? []).map(id => catMap.get(id)).filter(Boolean),
    }));
  }

  private async generateVisitCode(date: string): Promise<string> {
    const count = await this.visitRepo.count({ where: { visitDate: date } });
    const seq = String(count + 1).padStart(3, '0');
    return `VK-${date.replace(/-/g, '')}-${seq}`;
  }
}
