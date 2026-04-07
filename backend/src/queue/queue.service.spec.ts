import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { QueueService } from './queue.service';
import { ScoreService } from './score.service';
import { QueueEntry, QueueStatus } from './entities/queue-entry.entity';
import { PriorityCategory } from '../config/entities/priority-category.entity';
import { ConfigService } from '../config/config.service';
import { ScoreConfig } from '../config/entities/score-config.entity';

// ===== Helpers =====
const mockConfig = (): ScoreConfig =>
  ({
    timeCoefficient: 0.04,
    skipScores: [20, 40, 60],
    autoSkipScore: 5,
    waitingScorePerMinute: 1,
    lateDeductionPerMinute: 1,
  }) as ScoreConfig;

const makeEntry = (overrides: Partial<QueueEntry> = {}): QueueEntry =>
  ({
    id: 'entry-1',
    visitId: 'visit-1',
    roomId: 'room-1',
    status: QueueStatus.WAITING,
    scoreP: 100,
    scoreT: 0,
    scoreS: 0,
    scoreC: 0,
    scoreF: 0,
    totalScore: 100,
    skipCount: 0,
    autoSkipCount: 0,
    queuedAt: new Date(Date.now() - 10 * 60 * 1000),
    visit: { id: 'visit-1', visitDate: '2026-04-07', categoryIds: [], appointmentTime: null } as any,
    ...overrides,
  }) as QueueEntry;

// ===== Mock repository factory =====
const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  findBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getRawMany: jest.fn().mockResolvedValue([]),
  }),
});

describe('QueueService', () => {
  let service: QueueService;
  let entryRepo: ReturnType<typeof mockRepo>;
  let categoryRepo: ReturnType<typeof mockRepo>;
  let configService: { getScoreConfig: jest.Mock };
  let scoreService: ScoreService;

  beforeEach(async () => {
    entryRepo = mockRepo();
    categoryRepo = mockRepo();
    configService = { getScoreConfig: jest.fn().mockResolvedValue(mockConfig()) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        ScoreService,
        { provide: getRepositoryToken(QueueEntry), useValue: entryRepo },
        { provide: getRepositoryToken(PriorityCategory), useValue: categoryRepo },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(QueueService);
    scoreService = module.get(ScoreService);
  });

  // ===== addToQueue =====
  describe('addToQueue', () => {
    it('tạo entry mới khi chưa có', async () => {
      const visit = { id: 'visit-1', visitDate: '2026-04-07' } as any;
      const newEntry = makeEntry();
      entryRepo.findOne.mockResolvedValue(null);
      entryRepo.create.mockReturnValue(newEntry);
      entryRepo.save.mockResolvedValue(newEntry);

      const result = await service.addToQueue(visit, 100, 'room-1', 'new' as any);

      expect(entryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ visitId: 'visit-1', roomId: 'room-1', scoreP: 100 }),
      );
      expect(entryRepo.save).toHaveBeenCalled();
      expect(result).toBe(newEntry);
    });

    it('không tạo trùng nếu đã có entry WAITING cùng phòng + loại', async () => {
      const existing = makeEntry();
      entryRepo.findOne.mockResolvedValue(existing);
      const visit = { id: 'visit-1' } as any;

      const result = await service.addToQueue(visit, 100, 'room-1', 'new' as any);

      expect(entryRepo.create).not.toHaveBeenCalled();
      expect(result).toBe(existing);
    });
  });

  // ===== skipEntry =====
  describe('skipEntry', () => {
    it('tăng skipCount và cộng điểm S theo config', async () => {
      const entry = makeEntry({ skipCount: 0, scoreS: 0, totalScore: 100 });
      entryRepo.findOne.mockResolvedValue(entry);
      entryRepo.save.mockImplementation(async (e) => e);
      // Mock recalculateQueue (internal) — dùng createQueryBuilder đã mock ở trên
      entryRepo.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      await service.skipEntry('entry-1');

      expect(entry.skipCount).toBe(1);
      expect(entry.scoreS).toBe(20); // skipScores[0] = 20
      expect(entry.totalScore).toBe(120); // 100 + 20
    });

    it('lần skip 2: cộng thêm 40', async () => {
      const entry = makeEntry({ skipCount: 1, scoreS: 20, totalScore: 120 });
      entryRepo.findOne.mockResolvedValue(entry);
      entryRepo.save.mockImplementation(async (e) => e);
      entryRepo.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      await service.skipEntry('entry-1');

      expect(entry.skipCount).toBe(2);
      expect(entry.scoreS).toBe(60); // 20 + 40
      expect(entry.totalScore).toBe(160);
    });

    it('ném NotFoundException nếu không tìm thấy entry', async () => {
      entryRepo.findOne.mockResolvedValue(null);
      await expect(service.skipEntry('không-tồn-tại')).rejects.toThrow(NotFoundException);
    });
  });

  // ===== inviteToRoom =====
  describe('inviteToRoom', () => {
    it('chuyển status sang IN_ROOM và gán slotId', async () => {
      const entry = makeEntry();
      entryRepo.findOne.mockResolvedValue(entry);
      entryRepo.save.mockImplementation(async (e) => e);

      const result = await service.inviteToRoom({ queueEntryId: 'entry-1', slotId: 'slot-1' });

      expect(result.status).toBe(QueueStatus.IN_ROOM);
      expect(result.slotId).toBe('slot-1');
      expect(result.startedAt).toBeInstanceOf(Date);
    });

    it('ném NotFoundException nếu entry không ở trạng thái WAITING', async () => {
      entryRepo.findOne.mockResolvedValue(null);
      await expect(
        service.inviteToRoom({ queueEntryId: 'x', slotId: 'y' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ===== markDone =====
  describe('markDone', () => {
    it('chuyển status sang DONE, xoá slotId', async () => {
      const entry = makeEntry({ status: QueueStatus.IN_ROOM, slotId: 'slot-1' });
      entryRepo.findOne.mockResolvedValue(entry);
      entryRepo.save.mockImplementation(async (e) => e);
      entryRepo.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.markDone('entry-1');

      expect(result.status).toBe(QueueStatus.DONE);
      expect(result.slotId).toBeNull();
      expect(result.finishedAt).toBeInstanceOf(Date);
    });

    it('ném NotFoundException nếu entry không ở trạng thái IN_ROOM', async () => {
      entryRepo.findOne.mockResolvedValue(null);
      await expect(service.markDone('x')).rejects.toThrow(NotFoundException);
    });
  });

  // ===== updateFairness =====
  describe('updateFairness', () => {
    it('cập nhật scoreF và tính lại totalScore', async () => {
      const entry = makeEntry({ scoreP: 100, scoreF: 0 });
      entryRepo.findOne.mockResolvedValue(entry);
      entryRepo.save.mockImplementation(async (e) => e);
      entryRepo.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      await service.updateFairness({ queueEntryId: 'entry-1', scoreF: 50 });

      expect(entry.scoreF).toBe(50);
      // totalScore phải bao gồm scoreF = 50
      expect(entry.totalScore).toBeGreaterThanOrEqual(50);
    });

    it('ném NotFoundException nếu không tìm thấy entry', async () => {
      entryRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateFairness({ queueEntryId: 'x', scoreF: 10 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ===== updateQueuedAt =====
  describe('updateQueuedAt', () => {
    it('cập nhật queuedAt và tính lại điểm T, C', async () => {
      const entry = makeEntry({ scoreT: 0, scoreC: 0, totalScore: 100 });
      entryRepo.findOne.mockResolvedValue(entry);
      entryRepo.save.mockImplementation(async (e) => e);
      entryRepo.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      const newTime = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 phút trước
      await service.updateQueuedAt({ queueEntryId: 'entry-1', queuedAt: newTime });

      expect(entry.queuedAt).toEqual(new Date(newTime));
      // T(30) = 30 + 0.04*900 = 66
      expect(entry.scoreT).toBeGreaterThan(0);
    });

    it('ném NotFoundException nếu không tìm thấy entry', async () => {
      entryRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateQueuedAt({ queueEntryId: 'x', queuedAt: new Date().toISOString() }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ===== getWaitingEntries =====
  describe('getWaitingEntries', () => {
    it('trả về danh sách entries WAITING của visit', async () => {
      const entries = [makeEntry(), makeEntry({ id: 'entry-2', roomId: 'room-2' })];
      entryRepo.find.mockResolvedValue(entries);

      const result = await service.getWaitingEntries('visit-1');

      expect(entryRepo.find).toHaveBeenCalledWith({
        where: { visitId: 'visit-1', status: QueueStatus.WAITING },
      });
      expect(result).toHaveLength(2);
    });
  });
});
