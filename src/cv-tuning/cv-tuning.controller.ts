import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    Body,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CvTuningService } from './cv-tuning.service';
import { Public } from '../common/decorators/public.decorator';
import { Express } from 'express';

@Controller('cv-tuning')
export class CvTuningController {
    constructor(private readonly cvTuningService: CvTuningService) { }

    @Post('tune')
    @Public()
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        fileFilter: (req, file, cb) => {
            const allowed = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword',
                'text/plain',
            ];
            if (allowed.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Unsupported file type. Use PDF, DOCX, or TXT.'), false);
            }
        },
    }))
    async tuneCv(
        @UploadedFile() file: Express.Multer.File,
        @Body('jobDescription') jobDescription: string,
    ) {
        if (!file) {
            throw new BadRequestException('No CV file provided');
        }
        if (!jobDescription) {
            throw new BadRequestException('No job description provided');
        }

        return this.cvTuningService.tuneCv(file, jobDescription);
    }
}
