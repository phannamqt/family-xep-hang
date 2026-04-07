import {
  IsNumber,
  IsArray,
  IsInt,
  IsOptional,
  Min,
  ArrayMinSize,
} from 'class-validator';

export class UpdateScoreConfigDto {
  @IsNumber({}, { message: 'Hệ số thời gian phải là số' })
  @IsOptional()
  @Min(0, { message: 'Hệ số thời gian không được âm' })
  timeCoefficient?: number;

  @IsArray({ message: 'Điểm lỡ lượt phải là mảng số' })
  @IsOptional()
  @ArrayMinSize(1, { message: 'Phải có ít nhất 1 mức điểm lỡ lượt' })
  skipScores?: number[];

  @IsArray({ message: 'Điểm đẩy lùi tự động phải là mảng số' })
  @IsOptional()
  autoSkipScores?: number[];

  @IsNumber({}, { message: 'Điểm chờ mỗi phút phải là số' })
  @IsOptional()
  @Min(0, { message: 'Điểm chờ không được âm' })
  waitingScorePerMinute?: number;

  @IsNumber({}, { message: 'Điểm trừ đến trễ phải là số' })
  @IsOptional()
  @Min(0, { message: 'Điểm trừ không được âm' })
  lateDeductionPerMinute?: number;
}
