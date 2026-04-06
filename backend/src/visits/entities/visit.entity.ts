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
import { ClinicRoom } from '../../rooms/entities/clinic-room.entity';
import { QueueEntry, CheckInType } from '../../queue/entities/queue-entry.entity';

export { CheckInType };

@Entity('visits')
export class Visit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 30 })
  visitCode: string;

  @ManyToOne(() => Patient, (patient) => patient.visits)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'patient_id' })
  patientId: string;

  // Chọn nhiều đối tượng ưu tiên — lưu mảng UUID
  @Column({ type: 'uuid', array: true, default: '{}' })
  categoryIds: string[];

  // Phòng khám — nullable, chỉ được gán khi check-in
  @ManyToOne(() => ClinicRoom, { nullable: true })
  @JoinColumn({ name: 'room_id' })
  room: ClinicRoom;

  @Column({ name: 'room_id', nullable: true })
  roomId: string;

  @Column({ type: 'timestamptz', nullable: true })
  appointmentTime: Date;

  @Column({ type: 'enum', enum: CheckInType, nullable: true })
  checkInType: CheckInType;

  @Column({ type: 'timestamptz', nullable: true })
  checkInAt: Date;

  @Column({ type: 'date' })
  visitDate: string;

  @OneToMany(() => QueueEntry, (entry) => entry.visit)
  queueEntries: QueueEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
