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
  @IsInt({ message: 'Số slot phải là số nguyên' })
  @Min(1, { message: 'Số slot tối thiểu là 1' })
  @Max(10, { message: 'Số slot tối đa là 10' })
  count: number;
}

export class UpdateSlotDto {
  @IsString({ message: 'Tên bác sĩ phải là chuỗi ký tự' })
  @IsOptional()
  @MaxLength(100, { message: 'Tên bác sĩ tối đa 100 ký tự' })
  doctorName?: string;

  @IsBoolean({ message: 'Trạng thái vắng phải là true/false' })
  @IsOptional()
  isAbsent?: boolean;
}
