import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';

const PATIENT_CODE_START = 100000;

@Injectable()
export class PatientsService implements OnModuleInit {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  // Gán mã cho bệnh nhân cũ chưa có patientCode (chạy 1 lần khi server start)
  async onModuleInit() {
    const unassigned = await this.patientRepo.find({
      where: { patientCode: IsNull() },
      order: { createdAt: 'ASC' },
    });
    if (!unassigned.length) return;

    const maxResult = await this.patientRepo
      .createQueryBuilder('p')
      .select('MAX(p.patientCode)', 'max')
      .getRawOne();

    let next = Math.max(maxResult?.max ?? 0, PATIENT_CODE_START - 1) + 1;
    for (const patient of unassigned) {
      patient.patientCode = next++;
    }
    await this.patientRepo.save(unassigned);
  }

  private async nextPatientCode(): Promise<number> {
    const result = await this.patientRepo
      .createQueryBuilder('p')
      .select('MAX(p.patientCode)', 'max')
      .getRawOne();
    return Math.max(result?.max ?? 0, PATIENT_CODE_START - 1) + 1;
  }

  findAll(search?: string) {
    if (search) {
      return this.patientRepo.find({
        where: [
          { fullName: ILike(`%${search}%`) },
          { phone: ILike(`%${search}%`) },
          { idCard: ILike(`%${search}%`) },
        ],
        order: { patientCode: 'DESC' },
      });
    }
    return this.patientRepo.find({ order: { patientCode: 'DESC' } });
  }

  async findOne(id: string) {
    const patient = await this.patientRepo.findOne({
      where: { id },
      relations: ['visits'],
    });
    if (!patient) throw new NotFoundException(`Không tìm thấy bệnh nhân #${id}`);
    return patient;
  }

  async create(dto: CreatePatientDto) {
    const patient = this.patientRepo.create(dto);
    patient.patientCode = await this.nextPatientCode();
    return this.patientRepo.save(patient);
  }

  async update(id: string, dto: UpdatePatientDto) {
    const patient = await this.findOne(id);
    Object.assign(patient, dto);
    return this.patientRepo.save(patient);
  }

  async remove(id: string) {
    const patient = await this.findOne(id);
    return this.patientRepo.remove(patient);
  }
}
