import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
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
