import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RewriteDto {
  @ApiProperty({ example: 'Worked on various projects' })
  @IsString()
  @IsNotEmpty()
  text: string;
}

