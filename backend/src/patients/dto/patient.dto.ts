import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Gender } from '../entities/patient.entity';

export class CreatePatientDto {
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @MaxLength(150, { message: 'Họ tên tối đa 150 ký tự' })
  fullName: string;

  @IsDateString({}, { message: 'Ngày sinh không đúng định dạng (YYYY-MM-DD)' })
  dateOfBirth: string;

  @IsEnum(Gender, { message: 'Giới tính không hợp lệ (male, female hoặc other)' })
  @IsOptional()
  gender?: Gender;

  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @IsOptional()
  @MaxLength(20, { message: 'Số điện thoại tối đa 20 ký tự' })
  phone?: string;

  @IsString({ message: 'Số CCCD phải là chuỗi ký tự' })
  @IsOptional()
  @MaxLength(20, { message: 'Số CCCD tối đa 20 ký tự' })
  idCard?: string;

  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
  @IsOptional()
  @MaxLength(300, { message: 'Địa chỉ tối đa 300 ký tự' })
  address?: string;

  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @IsOptional()
  notes?: string;
}

export class UpdatePatientDto {
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @IsOptional()
  @MaxLength(150, { message: 'Họ tên tối đa 150 ký tự' })
  fullName?: string;

  @IsDateString({}, { message: 'Ngày sinh không đúng định dạng (YYYY-MM-DD)' })
  @IsOptional()
  dateOfBirth?: string;

  @IsEnum(Gender, { message: 'Giới tính không hợp lệ (male, female hoặc other)' })
  @IsOptional()
  gender?: Gender;

  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @IsOptional()
  @MaxLength(20, { message: 'Số điện thoại tối đa 20 ký tự' })
  phone?: string;

  @IsString({ message: 'Số CCCD phải là chuỗi ký tự' })
  @IsOptional()
  @MaxLength(20, { message: 'Số CCCD tối đa 20 ký tự' })
  idCard?: string;

  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
  @IsOptional()
  @MaxLength(300, { message: 'Địa chỉ tối đa 300 ký tự' })
  address?: string;

  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @IsOptional()
  notes?: string;
}
