import { ScoreService } from './score.service';
import { QueueEntry } from './entities/queue-entry.entity';
import { ScoreConfig } from '../config/entities/score-config.entity';

const mockConfig = (): ScoreConfig =>
  ({
    timeCoefficient: 0.04,
    skipScores: [20, 40, 60],
    autoSkipScore: 5,
    waitingScorePerMinute: 1,
    lateDeductionPerMinute: 1,
  }) as ScoreConfig;

const mockEntry = (overrides: Partial<QueueEntry> = {}): QueueEntry =>
  ({
    scoreP: 0,
    scoreS: 0,
    scoreF: 0,
    skipCount: 0,
    autoSkipCount: 0,
    queuedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 phút trước
    visit: null,
    ...overrides,
  }) as QueueEntry;

describe('ScoreService', () => {
  let service: ScoreService;

  beforeEach(() => {
    service = new ScoreService();
  });

  // ===== calcTimeScore =====
  describe('calcTimeScore', () => {
    it('trả về 0 khi chờ 0 phút', () => {
      expect(service.calcTimeScore(0, 0.04)).toBe(0);
    });

    it('T(10) = 10 + 0.04 * 100 = 14', () => {
      expect(service.calcTimeScore(10, 0.04)).toBeCloseTo(14);
    });

    it('T(60) = 60 + 0.04 * 3600 = 204', () => {
      expect(service.calcTimeScore(60, 0.04)).toBeCloseTo(204);
    });

    it('coeff = 0: chỉ trả về số phút chờ', () => {
      expect(service.calcTimeScore(45, 0)).toBe(45);
    });
  });

  // ===== getSkipScore =====
  describe('getSkipScore', () => {
    const scores = [20, 40, 60];

    it('lần 1 = 20', () => expect(service.getSkipScore(1, scores)).toBe(20));
    it('lần 2 = 40', () => expect(service.getSkipScore(2, scores)).toBe(40));
    it('lần 3 = 60', () => expect(service.getSkipScore(3, scores)).toBe(60));
    it('lần 4+ vẫn là 60 (capped)', () => expect(service.getSkipScore(4, scores)).toBe(60));
    it('0 lần = 0', () => expect(service.getSkipScore(0, scores)).toBe(0));
  });

  // ===== calcCheckInScore =====
  describe('calcCheckInScore', () => {
    it('không có appointmentTime: chỉ cộng điểm chờ', () => {
      const entry = mockEntry({
        queuedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 phút trước
        visit: null,
      });
      const score = service.calcCheckInScore(entry, mockConfig());
      // 10 phút * 1 = ~10 (±1 phút lệch do thời gian chạy test)
      expect(score).toBeGreaterThanOrEqual(9);
      expect(score).toBeLessThanOrEqual(11);
    });

    it('đến đúng giờ: không trừ điểm', () => {
      const appointmentTime = new Date(Date.now() - 5 * 60 * 1000); // hẹn 5 phút trước
      const queuedAt = new Date(Date.now() - 5 * 60 * 1000);        // check-in đúng giờ
      const entry = mockEntry({
        queuedAt,
        visit: { appointmentTime } as any,
      });
      const score = service.calcCheckInScore(entry, mockConfig());
      // lateMinutes = 0, không trừ
      expect(score).toBeGreaterThanOrEqual(4);
    });

    it('đến trễ 10 phút: trừ 10 điểm', () => {
      const appointmentTime = new Date(Date.now() - 20 * 60 * 1000); // hẹn 20 phút trước
      const queuedAt = new Date(Date.now() - 10 * 60 * 1000);        // check-in 10 phút trước (trễ 10 phút)
      const entry = mockEntry({
        queuedAt,
        visit: { appointmentTime } as any,
      });
      const config = mockConfig(); // lateDeductionPerMinute = 1
      const score = service.calcCheckInScore(entry, config);
      // waitMinutes ~10, lateMinutes ~10
      // score = 10*1 - 10*1 = ~0
      expect(score).toBeGreaterThanOrEqual(-2);
      expect(score).toBeLessThanOrEqual(2);
    });

    it('đến sớm: không cộng thêm, không trừ', () => {
      const appointmentTime = new Date(Date.now() + 30 * 60 * 1000); // hẹn 30 phút nữa
      const queuedAt = new Date(Date.now() - 5 * 60 * 1000);         // check-in 5 phút trước
      const entry = mockEntry({
        queuedAt,
        visit: { appointmentTime } as any,
      });
      const score = service.calcCheckInScore(entry, mockConfig());
      // lateMinutes < 0 → không trừ, chỉ cộng điểm chờ ~5
      expect(score).toBeGreaterThanOrEqual(4);
      expect(score).toBeLessThanOrEqual(6);
    });
  });

  // ===== calculate =====
  describe('calculate', () => {
    it('tổng hợp đúng P + T + S + C + F', () => {
      const queuedAt = new Date(Date.now() - 10 * 60 * 1000); // 10 phút
      const entry = mockEntry({
        scoreP: 100,
        scoreS: 20,
        scoreF: 5,
        queuedAt,
        visit: null,
      });
      const bd = service.calculate(entry, mockConfig());
      expect(bd.scoreP).toBe(100);
      expect(bd.scoreT).toBeCloseTo(14, 0); // T(10) = 10 + 0.04*100 = 14
      expect(bd.scoreS).toBe(20);
      expect(bd.scoreF).toBe(5);
      expect(bd.waitingMinutes).toBeGreaterThanOrEqual(9);
      expect(bd.total).toBeCloseTo(bd.scoreP + bd.scoreT + bd.scoreS + bd.scoreC + bd.scoreF, 1);
    });

    it('bệnh nhân vừa check-in (queuedAt = now): T ≈ 0', () => {
      const entry = mockEntry({
        scoreP: 50,
        queuedAt: new Date(),
        visit: null,
      });
      const bd = service.calculate(entry, mockConfig());
      expect(bd.scoreT).toBe(0);
      expect(bd.waitingMinutes).toBe(0);
    });
  });
});
