import { Injectable } from '@nestjs/common';
import { ScoreConfig } from '../config/entities/score-config.entity';
import { QueueEntry } from './entities/queue-entry.entity';

export interface ScoreBreakdown {
  scoreP: number;
  scoreT: number;
  scoreS: number;
  scoreC: number;
  scoreF: number;
  total: number;
  waitingMinutes: number;
}

@Injectable()
export class ScoreService {
  /**
   * T(t) = t + coeff * t^2
   */
  calcTimeScore(waitingMinutes: number, coeff: number): number {
    return waitingMinutes + coeff * Math.pow(waitingMinutes, 2);
  }

  /**
   * C = waitingScorePerMinute × t − lateDeductionPerMinute × phút trễ hẹn
   */
  calcCheckInScore(entry: QueueEntry, config: ScoreConfig): number {
    const queuedAt = entry.queuedAt;
    const now = new Date();
    const waitMinutes = Math.floor(
      (now.getTime() - queuedAt.getTime()) / 60000,
    );
    let score = waitMinutes * config.waitingScorePerMinute;

    if (entry.visit?.appointmentTime) {
      const appointmentTime = new Date(entry.visit.appointmentTime);
      const lateMinutes = Math.floor(
        (queuedAt.getTime() - appointmentTime.getTime()) / 60000,
      );
      if (lateMinutes > 0) {
        score -= lateMinutes * config.lateDeductionPerMinute;
      }
    }
    return score;
  }

  /**
   * Score = P + T(t) + S + C + F
   */
  calculate(entry: QueueEntry, config: ScoreConfig): ScoreBreakdown {
    const now = new Date();
    const waitingMinutes = Math.floor(
      (now.getTime() - entry.queuedAt.getTime()) / 60000,
    );

    const scoreP = entry.scoreP;
    const scoreT = this.calcTimeScore(waitingMinutes, config.timeCoefficient);
    const scoreS = entry.scoreS;
    const scoreC = this.calcCheckInScore(entry, config);
    const scoreF = entry.scoreF;
    const total = scoreP + scoreT + scoreS + scoreC + scoreF;

    return { scoreP, scoreT, scoreS, scoreC, scoreF, total, waitingMinutes };
  }

  /**
   * Điểm S theo lần skip thủ công: [20, 40, 60]
   */
  getSkipScore(skipCount: number, skipScores: number[]): number {
    if (skipCount <= 0) return 0;
    const idx = Math.min(skipCount - 1, skipScores.length - 1);
    return skipScores[idx];
  }
}
