import {
  IsNumber,
  IsArray,
  IsInt,
  IsOptional,
  Min,
  ArrayMinSize,
} from 'class-validator';

export class UpdateScoreConfigDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  timeCoefficient?: number;

  @IsArray()
  @IsOptional()
  @ArrayMinSize(1)
  skipScores?: number[];

  @IsInt()
  @IsOptional()
  @Min(0)
  autoSkipScore?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  waitingScorePerMinute?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  lateDeductionPerMinute?: number;
}
