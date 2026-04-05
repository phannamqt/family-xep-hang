import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriorityCategory } from './entities/priority-category.entity';
import { ScoreConfig } from './entities/score-config.entity';
import {
  CreatePriorityCategoryDto,
  UpdatePriorityCategoryDto,
} from './dto/priority-category.dto';
import { UpdateScoreConfigDto } from './dto/score-config.dto';

@Injectable()
export class ConfigService implements OnModuleInit {
  constructor(
    @InjectRepository(PriorityCategory)
    private readonly categoryRepo: Repository<PriorityCategory>,
    @InjectRepository(ScoreConfig)
    private readonly scoreConfigRepo: Repository<ScoreConfig>,
  ) {}

  // Tạo dữ liệu mặc định khi khởi động lần đầu
  async onModuleInit() {
    await this.seedDefaultCategories();
    await this.seedDefaultScoreConfig();
  }

  // ===== Priority Categories =====

  findAllCategories() {
    return this.categoryRepo.find({
      order: { sortOrder: 'ASC', scoreP: 'DESC' },
    });
  }

  async findOneCategory(id: string) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`Không tìm thấy đối tượng #${id}`);
    return category;
  }

  createCategory(dto: CreatePriorityCategoryDto) {
    const category = this.categoryRepo.create(dto);
    return this.categoryRepo.save(category);
  }

  async updateCategory(id: string, dto: UpdatePriorityCategoryDto) {
    const category = await this.findOneCategory(id);
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async removeCategory(id: string) {
    const category = await this.findOneCategory(id);
    return this.categoryRepo.remove(category);
  }

  // ===== Score Config (singleton) =====

  async getScoreConfig(): Promise<ScoreConfig> {
    const configs = await this.scoreConfigRepo.find({ take: 1 });
    return configs[0];
  }

  async updateScoreConfig(dto: UpdateScoreConfigDto): Promise<ScoreConfig> {
    const config = await this.getScoreConfig();
    Object.assign(config, dto);
    return this.scoreConfigRepo.save(config);
  }

  // ===== Seed defaults =====

  private async seedDefaultCategories() {
    const count = await this.categoryRepo.count();
    if (count > 0) return;

    const defaults = [
      { name: 'Cấp cứu', scoreP: 1000, sortOrder: 1 },
      { name: 'VIP', scoreP: 120, sortOrder: 2 },
      { name: 'Dịch vụ cao cấp (DVCC)', scoreP: 60, sortOrder: 3 },
      { name: 'KH chiến lược (IVF, Quảng Ngãi...)', scoreP: 30, sortOrder: 4 },
      { name: 'Người cao tuổi ≥ 70', scoreP: 20, sortOrder: 5 },
      { name: 'Người cao tuổi 60–69', scoreP: 10, sortOrder: 6 },
      { name: 'Trẻ em < 6 tuổi (có sốt/mệt)', scoreP: 15, sortOrder: 7 },
      { name: 'Trẻ em < 6 tuổi', scoreP: 5, sortOrder: 8 },
      { name: 'Bệnh nhân thường', scoreP: 0, sortOrder: 9 },
    ];

    await this.categoryRepo.save(
      defaults.map((d) => this.categoryRepo.create(d)),
    );
  }

  private async seedDefaultScoreConfig() {
    const count = await this.scoreConfigRepo.count();
    if (count > 0) return;
    await this.scoreConfigRepo.save(this.scoreConfigRepo.create({}));
  }
}
