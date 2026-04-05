import { IsUUID, IsString, IsNumber, IsOptional } from 'class-validator';

export class InviteToRoomDto {
  @IsUUID()
  queueEntryId: string;

  @IsUUID()
  slotId: string;
}

export class UpdateFairnessDto {
  @IsUUID()
  queueEntryId: string;

  @IsNumber()
  scoreF: number;
}

export class GetQueueDto {
  @IsString()
  roomId: string;

  @IsString()
  @IsOptional()
  date?: string; // 'YYYY-MM-DD', mặc định hôm nay
}
