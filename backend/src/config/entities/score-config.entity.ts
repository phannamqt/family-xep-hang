import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Lưu trữ các thông số cấu hình tính điểm toàn hệ thống.
 * Chỉ có 1 bản ghi (singleton config).
 */
@Entity('score_config')
export class ScoreConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // T(t) = t + timeCoefficient * t^2
  @Column({ type: 'float', default: 0.04 })
  timeCoefficient: number;

  // Điểm S cộng dồn theo lần skip thủ công
  @Column({ type: 'int', array: true, default: () => "'{20,40,60}'" })
  skipScores: number[]; // [20, 40, 60]

  // Điểm S cộng khi bị đẩy lùi tự động (Case 2)
  @Column({ type: 'int', default: 5 })
  autoSkipScore: number;

  // C: điểm cộng mỗi phút chờ thực tế
  @Column({ type: 'float', default: 1 })
  waitingScorePerMinute: number;

  // C: điểm trừ nếu đến trễ hẹn (mỗi phút trễ)
  @Column({ type: 'float', default: 1 })
  lateDeductionPerMinute: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
