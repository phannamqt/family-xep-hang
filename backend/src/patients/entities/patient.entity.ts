import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Visit } from '../../visits/entities/visit.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true, sparse: true })
  @Column({ type: 'int', nullable: true })
  patientCode: number | null; // Mã số bệnh nhân dạng số, bắt đầu từ 100000

  @Column({ length: 150 })
  fullName: string;

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column({ type: 'enum', enum: Gender, default: Gender.OTHER })
  gender: Gender;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 20, nullable: true, unique: true })
  idCard: string; // CCCD

  @Column({ length: 300, nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => Visit, (visit) => visit.patient)
  visits: Visit[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
