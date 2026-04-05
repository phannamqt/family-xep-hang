import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('priority_categories')
export class PriorityCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string; // Ví dụ: "Cấp cứu", "VIP", "Trẻ em < 6 tuổi"

  @Column({ length: 200, nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  scoreP: number; // Điểm ưu tiên nền P

  @Column({ type: 'int', default: 0 })
  sortOrder: number; // Thứ tự hiển thị trong dropdown

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
