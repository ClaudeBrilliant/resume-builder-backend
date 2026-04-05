import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OptimizeCvDto {
    @ApiProperty({ description: 'Personal information of the candidate' })
    @IsObject()
    personalInfo: any;

    @ApiProperty({ description: 'Work experience', type: [Object] })
    @IsArray()
    experiences: any[];

    @ApiProperty({ description: 'Current list of skills', type: [String] })
    @IsArray()
    @IsString({ each: true })
    skills: string[];

    @ApiProperty({ description: 'Portfolio projects', type: [Object] })
    @IsArray()
    projects: any[];

    @ApiProperty({ description: 'The job description to optimize for' })
    @IsString()
    @IsNotEmpty()
    jobDescription: string;
}
