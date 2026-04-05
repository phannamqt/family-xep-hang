import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';

export class CreatePriorityCategoryDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsInt()
  @Min(0)
  scoreP: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;
}

export class UpdatePriorityCategoryDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  scoreP?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
