import { IsUUID, IsString, IsNumber, IsOptional } from 'class-validator';

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

export class GetQueueDto {
  @IsString({ message: 'ID phòng không hợp lệ' })
  roomId: string;

  @IsString({ message: 'Ngày không đúng định dạng' })
  @IsOptional()
  date?: string;
}
