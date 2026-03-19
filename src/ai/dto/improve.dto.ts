import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ImproveDto {
  @ApiProperty({ example: 'I did some work on a project' })
  @IsString()
  @IsNotEmpty()
  text: string;
}

