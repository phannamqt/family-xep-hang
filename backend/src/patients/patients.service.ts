import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  findAll(search?: string) {
    if (search) {
      return this.patientRepo.find({
        where: [
          { fullName: ILike(`%${search}%`) },
          { phone: ILike(`%${search}%`) },
          { idCard: ILike(`%${search}%`) },
        ],
        order: { fullName: 'ASC' },
      });
    }
    return this.patientRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const patient = await this.patientRepo.findOne({
      where: { id },
      relations: ['visits'],
    });
    if (!patient) throw new NotFoundException(`Không tìm thấy bệnh nhân #${id}`);
    return patient;
  }

  create(dto: CreatePatientDto) {
    const patient = this.patientRepo.create(dto);
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
