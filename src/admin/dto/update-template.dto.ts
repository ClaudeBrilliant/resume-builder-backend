import { IsString, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TemplateCategory } from '@prisma/client';

export class UpdateTemplateDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ enum: TemplateCategory, required: false })
  @IsEnum(TemplateCategory)
  @IsOptional()
  category?: TemplateCategory;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  structure?: any;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isPremium?: boolean;
}


