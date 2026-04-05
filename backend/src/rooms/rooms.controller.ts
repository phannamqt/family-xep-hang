import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateClinicRoomDto, UpdateClinicRoomDto } from './dto/clinic-room.dto';
import { UpsertSlotsDto, UpdateSlotDto } from './dto/doctor-slot.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateClinicRoomDto) {
    return this.roomsService.createRoom(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClinicRoomDto) {
    return this.roomsService.updateRoom(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomsService.removeRoom(id);
  }

  // ===== Slots =====

  // GET /rooms/:id/slots/available — lấy slot trống (dùng khi "Mời vào khám")
  @Get(':id/slots/available')
  getAvailableSlots(@Param('id') id: string) {
    return this.roomsService.findAvailableSlots(id);
  }

  // PUT /rooms/:id/slots — cấu hình số lượng slot
  @Post(':id/slots')
  upsertSlots(@Param('id') id: string, @Body() dto: UpsertSlotsDto) {
    return this.roomsService.upsertSlots(id, dto);
  }

  // PATCH /rooms/:roomId/slots/:slotId — cập nhật slot (tên bs, trạng thái vắng)
  @Patch(':roomId/slots/:slotId')
  updateSlot(
    @Param('roomId') roomId: string,
    @Param('slotId') slotId: string,
    @Body() dto: UpdateSlotDto,
  ) {
    return this.roomsService.updateSlot(roomId, slotId, dto);
  }
}
