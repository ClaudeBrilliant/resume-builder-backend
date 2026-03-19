import { IsString, IsOptional, IsObject, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateResumeDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  content?: any;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isComplete?: boolean;

  @ApiProperty({ required: false, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  completionScore?: number;
}

