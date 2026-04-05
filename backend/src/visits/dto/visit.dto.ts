import {
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CheckInType } from '../entities/visit.entity';

export class CreateVisitDto {
  @IsUUID()
  patientId: string;

  // Nhiều đối tượng ưu tiên
  @IsArray()
  @IsUUID('all', { each: true })
  @ArrayMinSize(1)
  categoryIds: string[];

  // Không cần roomId khi tạo lượt khám
  @Transform(({ value }) => value || undefined)
  @IsDateString()
  @IsOptional()
  appointmentTime?: string;

  @IsDateString()
  @IsOptional()
  visitDate?: string;
}

export class UpdateVisitCategoriesDto {
  @IsArray()
  @IsUUID('all', { each: true })
  @ArrayMinSize(1)
  categoryIds: string[];
}

export class CheckInDto {
  @IsString()
  visitCode: string;

  @IsEnum(CheckInType)
  type: CheckInType;

  // Room được chọn tại màn hình xếp hàng
  @IsUUID()
  roomId: string;
}
