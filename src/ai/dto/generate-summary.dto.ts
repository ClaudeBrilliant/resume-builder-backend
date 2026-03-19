import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateSummaryDto {
  @ApiProperty({ example: 'Software Engineer with 5 years of experience' })
  @IsString()
  @IsNotEmpty()
  experience: string;

  @ApiProperty({ example: ['JavaScript', 'TypeScript', 'React'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];
}

