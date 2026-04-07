import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ClinicRoom } from './entities/clinic-room.entity';
import { DoctorSlot } from './entities/doctor-slot.entity';
import { CreateClinicRoomDto, UpdateClinicRoomDto } from './dto/clinic-room.dto';
import { UpsertSlotsDto, UpdateSlotDto } from './dto/doctor-slot.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(ClinicRoom)
    private readonly roomRepo: Repository<ClinicRoom>,
    @InjectRepository(DoctorSlot)
    private readonly slotRepo: Repository<DoctorSlot>,
  ) {}

  // ===== Rooms =====

  findAll() {
    return this.roomRepo.find({
      relations: ['slots'],
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string) {
    const room = await this.roomRepo.findOne({
      where: { id },
      relations: ['slots'],
      order: { slots: { slotNumber: 'ASC' } } as any,
    });
    if (!room) throw new NotFoundException(`Không tìm thấy phòng khám #${id}`);
    return room;
  }

  async createRoom(dto: CreateClinicRoomDto) {
    const existing = await this.roomRepo.findOne({ where: { name: dto.name, isActive: true } });
    if (existing) throw new ConflictException(`Phòng khám "${dto.name}" đã tồn tại`);
    const room = this.roomRepo.create(dto);
    return this.roomRepo.save(room);
  }

  async updateRoom(id: string, dto: UpdateClinicRoomDto) {
    const room = await this.findOne(id);
    if (dto.name && dto.name !== room.name) {
      const existing = await this.roomRepo.findOne({ where: { name: dto.name, isActive: true, id: Not(id) } });
      if (existing) throw new ConflictException(`Phòng khám "${dto.name}" đã tồn tại`);
    }
    Object.assign(room, dto);
    return this.roomRepo.save(room);
  }

  async removeRoom(id: string) {
    const room = await this.findOne(id);
    // Soft delete: đánh dấu isActive = false thay vì xoá hẳn để giữ lịch sử queue
    room.isActive = false;
    return this.roomRepo.save(room);
  }

  // ===== Slots =====

  async upsertSlots(roomId: string, dto: UpsertSlotsDto) {
    const room = await this.findOne(roomId);
    const existingSlots = await this.slotRepo.find({
      where: { roomId },
      order: { slotNumber: 'ASC' },
    });

    const currentCount = existingSlots.length;
    const targetCount = dto.count;

    if (targetCount > currentCount) {
      // Thêm slot mới
      const toAdd: Partial<DoctorSlot>[] = [];
      for (let i = currentCount + 1; i <= targetCount; i++) {
        toAdd.push({ roomId: room.id, slotNumber: i });
      }
      await this.slotRepo.save(toAdd);
    } else if (targetCount < currentCount) {
      // Xóa slot thừa (từ cuối)
      const toRemove = existingSlots.slice(targetCount);
      await this.slotRepo.remove(toRemove);
    }

    return this.slotRepo.find({
      where: { roomId },
      order: { slotNumber: 'ASC' },
    });
  }

  async updateSlot(roomId: string, slotId: string, dto: UpdateSlotDto) {
    const slot = await this.slotRepo.findOne({
      where: { id: slotId, roomId },
    });
    if (!slot) throw new NotFoundException(`Không tìm thấy slot #${slotId}`);
    Object.assign(slot, dto);
    return this.slotRepo.save(slot);
  }

  findAvailableSlots(roomId: string) {
    return this.slotRepo.find({
      where: { roomId, isAbsent: false },
      order: { slotNumber: 'ASC' },
    });
  }
}
