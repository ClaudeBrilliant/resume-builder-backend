import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SuggestSkillsDto {
  @ApiProperty({ example: 'Worked as a software engineer for 5 years developing web applications' })
  @IsString()
  @IsNotEmpty()
  experience: string;
}

