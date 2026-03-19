import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateResumeDto {
  @ApiProperty({ example: 'Software Engineer Resume' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  templateId: string;
}

