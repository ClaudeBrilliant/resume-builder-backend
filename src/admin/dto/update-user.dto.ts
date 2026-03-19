import { IsEmail, IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Plan } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsEnum(Plan)
  @IsOptional()
  plan?: Plan;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;
}


