import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Plan } from '@prisma/client';

export class CreateCheckoutDto {
  @ApiProperty({ enum: Plan, example: 'PRO' })
  @IsEnum(Plan)
  @IsNotEmpty()
  plan: Plan;
}

