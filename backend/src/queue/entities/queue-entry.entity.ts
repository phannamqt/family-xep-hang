import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Visit } from '../../visits/entities/visit.entity';
import { DoctorSlot } from '../../rooms/entities/doctor-slot.entity';

export enum QueueStatus {
  WAITING = 'waiting',     // Đang chờ khám
  IN_ROOM = 'in_room',     // Đang trong phòng khám
  DONE = 'done',           // Đã khám xong
  SKIPPED = 'skipped',     // Bị bỏ qua (tạm thời), vẫn trong queue
}

@Entity('queue_entries')
export class QueueEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Visit, (visit) => visit.queueEntries)
  @JoinColumn({ name: 'visit_id' })
  visit: Visit;

  @Column({ name: 'visit_id' })
  visitId: string;

  // Slot bác sĩ đang khám (null nếu đang chờ)
  @ManyToOne(() => DoctorSlot, { nullable: true })
  @JoinColumn({ name: 'slot_id' })
  slot: DoctorSlot;

  @Column({ name: 'slot_id', nullable: true })
  slotId: string;

  @Column({
    type: 'enum',
    enum: QueueStatus,
    default: QueueStatus.WAITING,
  })
  status: QueueStatus;

  // ===== Score components =====
  @Column({ type: 'float', default: 0 })
  scoreP: number; // Priority base (cố định từ category)

  @Column({ type: 'float', default: 0 })
  scoreT: number; // Time factor (tính lại theo thời gian)

  @Column({ type: 'float', default: 0 })
  scoreS: number; // Skip recovery (cộng dồn)

  @Column({ type: 'float', default: 0 })
  scoreC: number; // Check-in timing

  @Column({ type: 'float', default: 0 })
  scoreF: number; // Fairness (thủ công)

  @Column({ type: 'float', default: 0 })
  totalScore: number; // P + T + S + C + F

  // ===== Tracking =====
  @Column({ type: 'int', default: 0 })
  skipCount: number; // Số lần bị skip thủ công

  @Column({ type: 'int', default: 0 })
  autoSkipCount: number; // Số lần bị đẩy lùi tự động

  // Thứ hạng trước lần tính điểm gần nhất (dùng detect bị đẩy lùi)
  @Column({ type: 'int', nullable: true })
  previousRank: number;

  // Thứ hạng hiện tại
  @Column({ type: 'int', nullable: true })
  currentRank: number;

  // Thời điểm check-in vào queue (bắt đầu tính T(t))
  @Column({ type: 'timestamptz' })
  queuedAt: Date;

  // Thời điểm bắt đầu khám
  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date;

  // Thời điểm kết thúc khám
  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
