import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class EnhanceBulletsDto {
  @ApiProperty({
    description: 'Array of bullet points to enhance (max 10 at a time)',
    example: [
      'Worked on various projects',
      'Helped team members with tasks',
      'Managed daily operations',
    ],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one bullet point is required' })
  @ArrayMaxSize(10, { message: 'Maximum 10 bullet points allowed per request' })
  @IsString({ each: true })
  bullets: string[];
}