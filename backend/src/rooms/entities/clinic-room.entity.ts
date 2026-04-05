import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DoctorSlot } from './doctor-slot.entity';

export enum RoomType {
  EXAMINATION = 'examination',   // Phòng khám
  RESULT = 'result',             // Phòng trả kết quả
}

@Entity('clinic_rooms')
export class ClinicRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string; // Ví dụ: "Phòng khám 1", "Phòng trả kết quả"

  @Column({ length: 200, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: RoomType,
    default: RoomType.EXAMINATION,
  })
  type: RoomType;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => DoctorSlot, (slot) => slot.room, { cascade: true })
  slots: DoctorSlot[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
