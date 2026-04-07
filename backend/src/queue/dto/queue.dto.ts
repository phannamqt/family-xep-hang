import { IsUUID, IsString, IsNumber, IsOptional, IsDateString, IsInt, Min } from 'class-validator';

export class InviteToRoomDto {
  @IsUUID('all', { message: 'ID lượt xếp hàng không hợp lệ' })
  queueEntryId: string;

  @IsUUID('all', { message: 'ID slot không hợp lệ' })
  slotId: string;
}

export class UpdateFairnessDto {
  @IsUUID('all', { message: 'ID lượt xếp hàng không hợp lệ' })
  queueEntryId: string;

  @IsNumber({}, { message: 'Điểm F phải là số' })
  scoreF: number;
}

export class UpdateQueuedAtDto {
  @IsUUID('all', { message: 'ID lượt xếp hàng không hợp lệ' })
  queueEntryId: string;

  @IsDateString({}, { message: 'Thời gian không đúng định dạng ISO 8601' })
  queuedAt: string;
}

export class MarkDoneDto {
  @IsInt({ message: 'Thời gian khám phải là số nguyên' })
  @Min(1, { message: 'Thời gian khám phải lớn hơn 0' })
  @IsOptional()
  examinationMinutes?: number;
}

export class GetQueueDto {
  @IsString({ message: 'ID phòng không hợp lệ' })
  roomId: string;

  @IsString({ message: 'Ngày không đúng định dạng' })
  @IsOptional()
  date?: string;
}
