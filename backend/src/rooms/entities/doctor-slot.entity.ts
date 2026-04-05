import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClinicRoom } from './clinic-room.entity';

@Entity('doctor_slots')
export class DoctorSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ClinicRoom, (room) => room.slots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: ClinicRoom;

  @Column({ name: 'room_id' })
  roomId: string;

  @Column({ type: 'int' })
  slotNumber: number; // Số thứ tự slot: 1, 2, 3...

  @Column({ length: 100, nullable: true })
  doctorName: string;

  // true = bác sĩ vắng, không nhận bệnh nhân
  @Column({ default: false })
  isAbsent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
