import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { RoomType } from '../entities/clinic-room.entity';

export class CreateClinicRoomDto {
  @IsString({ message: 'Tên phòng phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Tên phòng tối đa 100 ký tự' })
  name: string;

  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @IsOptional()
  @MaxLength(200, { message: 'Mô tả tối đa 200 ký tự' })
  description?: string;

  @IsEnum(RoomType, { message: 'Loại phòng không hợp lệ (examination hoặc result)' })
  @IsOptional()
  type?: RoomType;
}

export class UpdateClinicRoomDto {
  @IsString({ message: 'Tên phòng phải là chuỗi ký tự' })
  @IsOptional()
  @MaxLength(100, { message: 'Tên phòng tối đa 100 ký tự' })
  name?: string;

  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @IsOptional()
  @MaxLength(200, { message: 'Mô tả tối đa 200 ký tự' })
  description?: string;

  @IsEnum(RoomType, { message: 'Loại phòng không hợp lệ (examination hoặc result)' })
  @IsOptional()
  type?: RoomType;

  @IsBoolean({ message: 'Trạng thái phải là true/false' })
  @IsOptional()
  isActive?: boolean;
}
