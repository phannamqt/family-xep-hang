import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class UpsertSlotsDto {
  // Số lượng slot cần có cho phòng (1-10)
  @IsInt()
  @Min(1)
  @Max(10)
  count: number;
}

export class UpdateSlotDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  doctorName?: string;

  @IsBoolean()
  @IsOptional()
  isAbsent?: boolean;
}
