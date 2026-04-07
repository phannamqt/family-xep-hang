import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { format } from 'date-fns';
import { QueueEntry, QueueStatus } from './entities/queue-entry.entity';
import { Visit } from '../visits/entities/visit.entity';
import { CheckInType } from '../visits/entities/visit.entity';
import { ConfigService } from '../config/config.service';
import { ScoreService, ScoreBreakdown } from './score.service';
import {
  InviteToRoomDto,
  UpdateFairnessDto,
  UpdateQueuedAtDto,
} from './dto/queue.dto';
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
    initialScore: number = 0,
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
      scoreF: initialScore,
      totalScore: scoreP + initialScore,
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
  // detectPushback=true: dùng khi có sự kiện thực sự (check-in mới, skip, done)
  // detectPushback=false: dùng khi scheduler cập nhật T(t) định kỳ
  async recalculateQueue(
    roomId: string,
    date?: string,
    detectPushback = true,
  ): Promise<QueueEntry[]> {
    const targetDate = date ?? format(new Date(), 'yyyy-MM-dd');
    const config = await this.configService.getScoreConfig();

    const waitingEntries = await this.entryRepo
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.visit', 'visit')
      .where('entry.roomId = :roomId', { roomId })
      .andWhere('visit.visitDate = :date', { date: targetDate })
      .andWhere('entry.status = :status', { status: QueueStatus.WAITING })
      .getMany();

    // Lưu rank cũ theo thứ tự điểm hiện tại (trước khi recalculate)
    const oldRanks = new Map<string, number>();
    [...waitingEntries]
      .sort((a, b) => b.totalScore - a.totalScore)
      .forEach((e, idx) => oldRanks.set(e.id, idx + 1));

    // Tính lại score cho từng entry (Score = P + T(t) + S + F)
    for (const entry of waitingEntries) {
      const breakdown = this.scoreService.calculate(entry, config);
      entry.scoreT = breakdown.scoreT;
      entry.totalScore = breakdown.total;
    }

    // Sắp xếp lại theo điểm
    waitingEntries.sort((a, b) => b.totalScore - a.totalScore);

    // Chỉ detect pushback khi có sự kiện thực sự (không phải scheduler định kỳ)
    if (detectPushback) {
      for (let i = 0; i < waitingEntries.length; i++) {
        const entry = waitingEntries[i];
        const newRank = i + 1;
        const oldRank = oldRanks.get(entry.id) ?? newRank;

        if (newRank > oldRank) {
          const addedS = this.scoreService.getSkipScore(entry.autoSkipCount + 1, config.autoSkipScores);
          entry.scoreS += addedS;
          entry.autoSkipCount += 1;
          entry.totalScore += addedS;
        }

        entry.previousRank = oldRank;
        entry.currentRank = newRank;
      }
    } else {
      waitingEntries.forEach((e, idx) => {
        e.currentRank = idx + 1;
      });
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
  async markDone(entryId: string, examinationMinutes?: number): Promise<QueueEntry> {
    const entry = await this.entryRepo.findOne({
      where: { id: entryId, status: QueueStatus.IN_ROOM },
      relations: ['visit'],
    });
    if (!entry)
      throw new NotFoundException('Không tìm thấy ca khám đang diễn ra');

    entry.status = QueueStatus.DONE;
    entry.finishedAt = new Date();
    entry.slotId = null;
    if (examinationMinutes != null && examinationMinutes > 0) {
      entry.examinationMinutes = examinationMinutes;
    }
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
      dto.scoreF;

    const saved = await this.entryRepo.save(entry);
    await this.recalculateQueue(entry.roomId, entry.visit.visitDate);
    return saved;
  }

  // ===== Cập nhật thời gian bắt đầu chờ (queuedAt) =====
  async updateQueuedAt(dto: UpdateQueuedAtDto): Promise<QueueEntry> {
    const entry = await this.entryRepo.findOne({
      where: { id: dto.queueEntryId },
      relations: ['visit'],
    });
    if (!entry) throw new NotFoundException('Không tìm thấy lượt xếp hàng');

    entry.queuedAt = new Date(dto.queuedAt);
    const config = await this.configService.getScoreConfig();
    const breakdown = this.scoreService.calculate(entry, config);
    entry.scoreT = breakdown.scoreT;
    entry.totalScore = breakdown.total;

    const saved = await this.entryRepo.save(entry);
    await this.recalculateQueue(entry.roomId, entry.visit.visitDate);
    return saved;
  }

  // ===== Lấy các entries WAITING của 1 visit (để biết đang chờ phòng nào) =====
  async getWaitingEntries(visitId: string): Promise<QueueEntry[]> {
    return this.entryRepo.find({
      where: { visitId, status: QueueStatus.WAITING },
    });
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
      relations: ['visit'],
    });
    if (!entries.length) return;

    const config = await this.configService.getScoreConfig();
    const roomIds = new Set<string>();
    for (const entry of entries) {
      const breakdown = this.scoreService.calculate(entry, config);
      entry.scoreP = newScoreP;
      entry.totalScore = newScoreP + breakdown.scoreT + breakdown.scoreS + entry.scoreF;
      await this.entryRepo.save(entry);
      roomIds.add(entry.roomId);
    }
    // Tính lại toàn bộ queue từng phòng 1 lần (tránh gọi nhiều lần cùng phòng)
    for (const roomId of roomIds) {
      await this.recalculateQueue(roomId, visitDate);
    }
  }

  // ===== Timer job: tính lại T(t) cho tất cả phòng đang hoạt động =====
  async recalculateAllActiveQueues(): Promise<void> {
    const today = format(new Date(), 'yyyy-MM-dd');

    const activeRooms = await this.entryRepo
      .createQueryBuilder('entry')
      .leftJoin('entry.visit', 'visit')
      .select('DISTINCT entry."room_id"', 'roomId')
      .where('visit.visitDate = :date', { date: today })
      .andWhere('entry.status = :status', { status: QueueStatus.WAITING })
      .getRawMany();

    for (const { roomId } of activeRooms) {
      // Không detect pushback khi scheduler chạy định kỳ
      await this.recalculateQueue(roomId, today, false);
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
