import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Gender } from '../entities/patient.entity';

export class CreatePatientDto {
  @IsString()
  @MaxLength(150)
  fullName: string;

  @IsDateString()
  dateOfBirth: string; // 'YYYY-MM-DD'

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  idCard?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  address?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePatientDto {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  fullName?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  idCard?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  address?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
