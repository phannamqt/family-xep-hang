import {
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { format } from 'date-fns';
import { Visit, CheckInType } from './entities/visit.entity';
import { CreateVisitDto, CheckInDto, UpdateVisitCategoriesDto, UpdateVisitDto } from './dto/visit.dto';
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

  async update(id: string, dto: UpdateVisitDto) {
    const visit = await this.visitRepo.findOne({ where: { id } });
    if (!visit) throw new NotFoundException(`Không tìm thấy lượt khám #${id}`);

    const categoriesChanged =
      JSON.stringify([...dto.categoryIds].sort()) !==
      JSON.stringify([...(visit.categoryIds ?? [])].sort());
    const appointmentChanged =
      (dto.appointmentTime ?? '') !==
      (visit.appointmentTime
        ? visit.appointmentTime.toISOString().slice(0, 16)
        : '');

    visit.categoryIds = dto.categoryIds;
    visit.appointmentTime = dto.appointmentTime ? new Date(dto.appointmentTime) : null;
    await this.visitRepo.save(visit);

    if (visit.checkInAt && (categoriesChanged || appointmentChanged)) {
      const categories = await this.categoryRepo.findBy({ id: In(dto.categoryIds) });
      const newScoreP = categories.reduce((sum, c) => sum + c.scoreP, 0);

      // Lấy roomIds trước để emit socket sau khi tính xong
      const waitingEntries = await this.queueService.getWaitingEntries(id);
      const roomIds = [...new Set(waitingEntries.map((e) => e.roomId))];

      await this.queueService.updatePScore(id, newScoreP, visit.visitDate);

      // Push realtime update tới tất cả phòng liên quan
      for (const roomId of roomIds) {
        await this.queueGateway.emitQueueUpdate(roomId, visit.visitDate);
      }
    }

    return this.findOne(id);
  }

  async updateCategories(id: string, dto: UpdateVisitCategoriesDto) {
    const visit = await this.visitRepo.findOne({ where: { id } });
    if (!visit) throw new NotFoundException(`Không tìm thấy lượt khám #${id}`);

    visit.categoryIds = dto.categoryIds;
    await this.visitRepo.save(visit);

    // Tính lại scoreP cho tất cả QueueEntry đang chờ của visit này
    if (visit.checkInAt) {
      const categories = await this.categoryRepo.findBy({ id: In(dto.categoryIds) });
      const newScoreP = categories.reduce((sum, c) => sum + c.scoreP, 0);
      await this.queueService.updatePScore(id, newScoreP, visit.visitDate);
    }

    return this.findOne(id);
  }

  async checkIn(dto: CheckInDto): Promise<any> {
    const visit = await this.visitRepo.findOne({
      where: { visitCode: dto.visitCode },
      relations: ['patient'],
    });
    if (!visit) throw new NotFoundException(`Không tìm thấy lượt khám: ${dto.visitCode}`);

    // Ghi nhận lần check-in đầu tiên (chỉ set một lần)
    if (!visit.checkInAt) {
      visit.checkInAt = new Date();
      await this.visitRepo.save(visit);
    }

    const categories = await this.categoryRepo.findBy({ id: In(visit.categoryIds) });
    const scoreP = categories.reduce((sum, c) => sum + c.scoreP, 0);

    // Tạo QueueEntry cho phòng này (cho phép cùng visit vào nhiều phòng)
    await this.queueService.addToQueue(visit, scoreP, dto.roomId, dto.type, dto.initialScore ?? 0);
    await this.queueGateway.emitQueueUpdate(dto.roomId, visit.visitDate);

    const [enriched] = await this.attachCategories([visit]);
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
