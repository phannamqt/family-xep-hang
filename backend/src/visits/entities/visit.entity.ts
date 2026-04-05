import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { PriorityCategory } from '../../config/entities/priority-category.entity';
import { ClinicRoom } from '../../rooms/entities/clinic-room.entity';
import { QueueEntry } from '../../queue/entities/queue-entry.entity';

export enum CheckInType {
  NEW = 'new',       // Khám mới
  RESULT = 'result', // Trả kết quả
}

@Entity('visits')
export class Visit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Short code dạng VK-20240405-001, hiển thị cho user copy
  @Column({ unique: true, length: 30 })
  visitCode: string;

  @ManyToOne(() => Patient, (patient) => patient.visits)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'patient_id' })
  patientId: string;

  @ManyToOne(() => PriorityCategory)
  @JoinColumn({ name: 'category_id' })
  category: PriorityCategory;

  @Column({ name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => ClinicRoom)
  @JoinColumn({ name: 'room_id' })
  room: ClinicRoom;

  @Column({ name: 'room_id' })
  roomId: string;

  // Giờ hẹn (optional, dùng tính C score)
  @Column({ type: 'timestamptz', nullable: true })
  appointmentTime: Date;

  @Column({
    type: 'enum',
    enum: CheckInType,
    nullable: true,
  })
  checkInType: CheckInType;

  // Thời điểm check-in thực tế
  @Column({ type: 'timestamptz', nullable: true })
  checkInAt: Date;

  // Ngày khám (dùng để lọc theo ngày trên queue board)
  @Column({ type: 'date' })
  visitDate: string; // 'YYYY-MM-DD'

  @OneToMany(() => QueueEntry, (entry) => entry.visit)
  queueEntries: QueueEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
