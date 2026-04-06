import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { format } from 'date-fns';
import { QueueEntry, QueueStatus } from './entities/queue-entry.entity';
import { Visit } from '../visits/entities/visit.entity';
import { CheckInType } from '../visits/entities/visit.entity';
import { ConfigService } from '../config/config.service';
import { ScoreService, ScoreBreakdown } from './score.service';
import { InviteToRoomDto, UpdateFairnessDto } from './dto/queue.dto';
import { PriorityCategory } from '../config/entities/priority-category.entity';

export interface QueueEntryWithScore extends QueueEntry {
  scoreBreakdown: ScoreBreakdown;
}

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(QueueEntry)
    private readonly entryRepo: Repository<QueueEntry>,
    @InjectRepository(PriorityCategory)
    private readonly categoryRepo: Repository<PriorityCategory>,
    private readonly configService: ConfigService,
    private readonly scoreService: ScoreService,
  ) {}

  // ===== Thêm bệnh nhân vào queue khi check-in =====
  // 1 visit có thể check-in nhiều phòng khác nhau → mỗi lần tạo 1 QueueEntry
  // Cùng phòng + cùng loại → không tạo trùng nếu đang WAITING
  async addToQueue(
    visit: Visit,
    scoreP: number = 0,
    roomId: string,
    checkInType: CheckInType,
  ): Promise<QueueEntry> {
    const existing = await this.entryRepo.findOne({
      where: {
        visitId: visit.id,
        roomId,
        checkInType,
        status: QueueStatus.WAITING,
      },
    });
    if (existing) return existing;

    const entry = this.entryRepo.create({
      visitId: visit.id,
      visit,
      roomId,
      checkInType,
      status: QueueStatus.WAITING,
      scoreP,
      scoreT: 0,
      scoreS: 0,
      scoreC: 0,
      scoreF: 0,
      totalScore: scoreP,
      queuedAt: new Date(),
    });

    return this.entryRepo.save(entry);
  }

  // ===== Lấy danh sách queue theo phòng + ngày =====
  async getQueue(
    roomId: string,
    date?: string,
  ): Promise<QueueEntryWithScore[]> {
    const targetDate = date ?? format(new Date(), 'yyyy-MM-dd');
    const config = await this.configService.getScoreConfig();

    const entries = await this.entryRepo
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.visit', 'visit')
      .leftJoinAndSelect('visit.patient', 'patient')
      .leftJoinAndSelect('entry.slot', 'slot')
      .where('entry.roomId = :roomId', { roomId })
      .andWhere('visit.visitDate = :date', { date: targetDate })
      .andWhere('entry.status IN (:...statuses)', {
        statuses: [QueueStatus.WAITING, QueueStatus.IN_ROOM, QueueStatus.DONE],
      })
      .getMany();

    await this.attachCategories(entries);

    // Tính score realtime cho từng entry
    return entries.map((entry) => ({
      ...entry,
      scoreBreakdown: this.scoreService.calculate(entry, config),
    }));
  }

  // ===== Tính lại điểm toàn bộ queue đang chờ =====
  async recalculateQueue(roomId: string, date?: string): Promise<QueueEntry[]> {
    const targetDate = date ?? format(new Date(), 'yyyy-MM-dd');
    const config = await this.configService.getScoreConfig();

    const waitingEntries = await this.entryRepo
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.visit', 'visit')
      .where('entry.roomId = :roomId', { roomId })
      .andWhere('visit.visitDate = :date', { date: targetDate })
      .andWhere('entry.status = :status', { status: QueueStatus.WAITING })
      .getMany();

    // Lưu rank cũ
    const oldRanks = new Map<string, number>();
    waitingEntries.forEach((e, idx) => oldRanks.set(e.id, idx + 1));

    // Tính lại score cho từng entry
    for (const entry of waitingEntries) {
      const breakdown = this.scoreService.calculate(entry, config);
      entry.scoreT = breakdown.scoreT;
      entry.scoreC = breakdown.scoreC;
      entry.totalScore = breakdown.total;
    }

    // Sắp xếp lại theo điểm
    waitingEntries.sort((a, b) => b.totalScore - a.totalScore);

    // Detect bệnh nhân bị đẩy lùi → cộng điểm S tự động
    for (let i = 0; i < waitingEntries.length; i++) {
      const entry = waitingEntries[i];
      const newRank = i + 1;
      const oldRank = oldRanks.get(entry.id) ?? newRank;

      if (newRank > oldRank) {
        // Bị đẩy lùi → cộng autoSkipScore
        entry.scoreS += config.autoSkipScore;
        entry.autoSkipCount += 1;
        entry.totalScore += config.autoSkipScore;
      }

      entry.previousRank = oldRank;
      entry.currentRank = newRank;
    }

    await this.entryRepo.save(waitingEntries);
    return waitingEntries;
  }

  // ===== Mời bệnh nhân vào phòng =====
  async inviteToRoom(dto: InviteToRoomDto): Promise<QueueEntry> {
    const entry = await this.entryRepo.findOne({
      where: { id: dto.queueEntryId, status: QueueStatus.WAITING },
      relations: ['visit'],
    });
    if (!entry)
      throw new NotFoundException('Không tìm thấy bệnh nhân trong hàng chờ');

    entry.status = QueueStatus.IN_ROOM;
    entry.slotId = dto.slotId;
    entry.startedAt = new Date();
    return this.entryRepo.save(entry);
  }

  // ===== Bác sĩ bấm Xong =====
  async markDone(entryId: string): Promise<QueueEntry> {
    const entry = await this.entryRepo.findOne({
      where: { id: entryId, status: QueueStatus.IN_ROOM },
      relations: ['visit'],
    });
    if (!entry)
      throw new NotFoundException('Không tìm thấy ca khám đang diễn ra');

    entry.status = QueueStatus.DONE;
    entry.finishedAt = new Date();
    entry.slotId = null;
    const saved = await this.entryRepo.save(entry);

    // Trigger tính lại queue
    await this.recalculateQueue(entry.roomId, entry.visit.visitDate);
    return saved;
  }

  // ===== Bác sĩ bấm Bỏ qua (Skip thủ công) =====
  async skipEntry(entryId: string): Promise<QueueEntry> {
    const entry = await this.entryRepo.findOne({
      where: { id: entryId, status: QueueStatus.WAITING },
      relations: ['visit'],
    });
    if (!entry)
      throw new NotFoundException('Không tìm thấy bệnh nhân trong hàng chờ');

    const config = await this.configService.getScoreConfig();

    entry.skipCount += 1;
    // Cộng điểm S theo lần skip
    const addedScore = this.scoreService.getSkipScore(
      entry.skipCount,
      config.skipScores,
    );
    entry.scoreS += addedScore;
    entry.totalScore += addedScore;

    const saved = await this.entryRepo.save(entry);

    // Trigger tính lại queue
    await this.recalculateQueue(entry.roomId, entry.visit.visitDate);
    return saved;
  }

  // ===== Cập nhật điểm Fairness (F) thủ công =====
  async updateFairness(dto: UpdateFairnessDto): Promise<QueueEntry> {
    const entry = await this.entryRepo.findOne({
      where: { id: dto.queueEntryId },
      relations: ['visit'],
    });
    if (!entry) throw new NotFoundException('Không tìm thấy queue entry');

    const config = await this.configService.getScoreConfig();
    const breakdown = this.scoreService.calculate(entry, config);

    entry.scoreF = dto.scoreF;
    entry.totalScore =
      breakdown.scoreP +
      breakdown.scoreT +
      breakdown.scoreS +
      breakdown.scoreC +
      dto.scoreF;

    const saved = await this.entryRepo.save(entry);
    await this.recalculateQueue(entry.roomId, entry.visit.visitDate);
    return saved;
  }

  // ===== Cập nhật P score khi thay đổi đối tượng trên lượt khám =====
  // Cập nhật tất cả entries WAITING của visit này (có thể nhiều phòng)
  async updatePScore(
    visitId: string,
    newScoreP: number,
    visitDate: string,
  ): Promise<void> {
    const entries = await this.entryRepo.find({
      where: { visitId, status: QueueStatus.WAITING },
    });
    if (!entries.length) return;

    const config = await this.configService.getScoreConfig();
    for (const entry of entries) {
      const breakdown = this.scoreService.calculate(entry, config);
      entry.scoreP = newScoreP;
      entry.totalScore =
        newScoreP +
        breakdown.scoreT +
        breakdown.scoreS +
        breakdown.scoreC +
        entry.scoreF;
      await this.entryRepo.save(entry);
      await this.recalculateQueue(entry.roomId, visitDate);
    }
  }

  // ===== Timer job: tính lại T(t) cho tất cả phòng đang hoạt động =====
  async recalculateAllActiveQueues(): Promise<void> {
    const today = format(new Date(), 'yyyy-MM-dd');

    // Lấy tất cả roomId đang có bệnh nhân chờ hôm nay (từ entry.roomId trực tiếp)
    const activeRooms = await this.entryRepo
      .createQueryBuilder('entry')
      .leftJoin('entry.visit', 'visit')
      .select('DISTINCT entry."room_id"', 'roomId')
      .where('visit.visitDate = :date', { date: today })
      .andWhere('entry.status = :status', { status: QueueStatus.WAITING })
      .getRawMany();

    for (const { roomId } of activeRooms) {
      await this.recalculateQueue(roomId, today);
    }
  }

  // ===== Populate categories vào visit (Visit chỉ lưu categoryIds) =====
  private async attachCategories(entries: QueueEntry[]): Promise<void> {
    const allIds = [
      ...new Set(entries.flatMap((e) => e.visit?.categoryIds ?? [])),
    ];
    if (!allIds.length) return;
    const categories = await this.categoryRepo.findBy({ id: In(allIds) });
    const catMap = new Map(categories.map((c) => [c.id, c]));
    for (const entry of entries) {
      if (entry.visit) {
        (entry.visit as any).categories = (entry.visit.categoryIds ?? [])
          .map((id) => catMap.get(id))
          .filter(Boolean);
      }
    }
  }
}
