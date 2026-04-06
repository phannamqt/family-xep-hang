import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';

export class CreatePriorityCategoryDto {
  @IsString({ message: 'Tên đối tượng phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Tên đối tượng tối đa 100 ký tự' })
  name: string;

  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @IsOptional()
  @MaxLength(200, { message: 'Mô tả tối đa 200 ký tự' })
  description?: string;

  @IsInt({ message: 'Điểm P phải là số nguyên' })
  @Min(0, { message: 'Điểm P không được âm' })
  scoreP: number;

  @IsInt({ message: 'Thứ tự phải là số nguyên' })
  @IsOptional()
  @Min(0, { message: 'Thứ tự không được âm' })
  sortOrder?: number;
}

export class UpdatePriorityCategoryDto {
  @IsString({ message: 'Tên đối tượng phải là chuỗi ký tự' })
  @IsOptional()
  @MaxLength(100, { message: 'Tên đối tượng tối đa 100 ký tự' })
  name?: string;

  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @IsOptional()
  @MaxLength(200, { message: 'Mô tả tối đa 200 ký tự' })
  description?: string;

  @IsInt({ message: 'Điểm P phải là số nguyên' })
  @IsOptional()
  @Min(0, { message: 'Điểm P không được âm' })
  scoreP?: number;

  @IsInt({ message: 'Thứ tự phải là số nguyên' })
  @IsOptional()
  @Min(0, { message: 'Thứ tự không được âm' })
  sortOrder?: number;

  @IsBoolean({ message: 'Trạng thái phải là true/false' })
  @IsOptional()
  isActive?: boolean;
}
