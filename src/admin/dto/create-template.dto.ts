import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TemplateCategory } from '@prisma/client';

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: TemplateCategory })
  @IsEnum(TemplateCategory)
  @IsNotEmpty()
  category: TemplateCategory;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  thumbnail: string;

  @ApiProperty()
  @IsObject()
  @IsNotEmpty()
  structure: any;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsNotEmpty()
  isPremium: boolean;
}


