import {
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { CheckInType } from '../entities/visit.entity';

export class CreateVisitDto {
  @IsUUID()
  patientId: string;

  @IsUUID()
  categoryId: string;

  @IsUUID()
  roomId: string;

  @IsDateString()
  @IsOptional()
  appointmentTime?: string; // ISO datetime string

  @IsDateString()
  @IsOptional()
  visitDate?: string; // 'YYYY-MM-DD', mặc định ngày hôm nay
}

export class UpdateVisitCategoryDto {
  @IsUUID()
  categoryId: string;
}

export class CheckInDto {
  @IsString()
  visitCode: string;

  @IsEnum(CheckInType)
  type: CheckInType; // 'new' | 'result'
}
