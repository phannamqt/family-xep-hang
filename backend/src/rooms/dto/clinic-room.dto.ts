import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { RoomType } from '../entities/clinic-room.entity';

export class CreateClinicRoomDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsEnum(RoomType)
  @IsOptional()
  type?: RoomType;
}

export class UpdateClinicRoomDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsEnum(RoomType)
  @IsOptional()
  type?: RoomType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
