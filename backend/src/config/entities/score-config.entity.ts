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

  // Điểm S cộng dồn khi bị đẩy lùi tự động (tăng dần như skipScores)
  @Column({ type: 'int', array: true, default: () => "'{5,10,20}'" })
  autoSkipScores: number[];

  // C: điểm cộng mỗi phút chờ thực tế
  @Column({ type: 'float', default: 1 })
  waitingScorePerMinute: number;

  // C: điểm trừ nếu đến trễ hẹn (mỗi phút trễ)
  @Column({ type: 'float', default: 1 })
  lateDeductionPerMinute: number;

  // Giữ lại cột cũ để không phá DB (không dùng nữa)
  @Column({ type: 'int', default: 5, select: false })
  autoSkipScore: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
