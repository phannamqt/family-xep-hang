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
  @IsUUID('all', { message: 'ID bệnh nhân không hợp lệ' })
  patientId: string;

  @IsArray({ message: 'Danh sách đối tượng ưu tiên phải là mảng' })
  @IsUUID('all', { each: true, message: 'ID đối tượng ưu tiên không hợp lệ' })
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 đối tượng ưu tiên' })
  categoryIds: string[];

  @Transform(({ value }) => value || undefined)
  @IsDateString({}, { message: 'Giờ hẹn không đúng định dạng ISO 8601' })
  @IsOptional()
  appointmentTime?: string;

  @IsDateString({}, { message: 'Ngày khám không đúng định dạng (YYYY-MM-DD)' })
  @IsOptional()
  visitDate?: string;
}

export class UpdateVisitCategoriesDto {
  @IsArray({ message: 'Danh sách đối tượng ưu tiên phải là mảng' })
  @IsUUID('all', { each: true, message: 'ID đối tượng ưu tiên không hợp lệ' })
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 đối tượng ưu tiên' })
  categoryIds: string[];
}

export class CheckInDto {
  @IsString({ message: 'Mã lượt khám không được để trống' })
  visitCode: string;

  @IsEnum(CheckInType, { message: 'Loại check-in không hợp lệ (new hoặc result)' })
  type: CheckInType;

  @IsUUID('all', { message: 'ID phòng khám không hợp lệ' })
  roomId: string;
}
