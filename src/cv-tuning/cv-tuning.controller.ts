import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    Body,
    BadRequestException,
    Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CvTuningService } from './cv-tuning.service';
import { Public } from '../common/decorators/public.decorator';
import { Express } from 'express';
import * as path from 'path';
import { Response } from 'express';
import { PdfService } from '../pdf/pdf.service';

@Controller('cv-tuning')
export class CvTuningController {
    constructor(
        private readonly cvTuningService: CvTuningService,
        private readonly pdfService: PdfService,
    ) { }

    @Post('tune')
    @Public()
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        fileFilter: (req, file, cb) => {
            const allowedMimeTypes = new Set([
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword',
                'text/plain',
                'application/octet-stream',
            ]);
            const ext = path.extname(file.originalname || '').toLowerCase();
            const allowedExt = new Set(['.pdf', '.docx', '.doc', '.txt']);
            if (allowedMimeTypes.has(file.mimetype) || allowedExt.has(ext)) {
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

    @Post('render-pdf')
    @Public()
    async renderPdf(
        @Body('title') title: string,
        @Body('content') content: string,
        @Body('templateCategory') templateCategory: 'MODERN' | 'PROFESSIONAL' | 'CREATIVE' | undefined,
        @Res() res: Response,
    ) {
        if (!content || !String(content).trim()) {
            throw new BadRequestException('No tuned CV content provided');
        }

        const buffer = await this.pdfService.generatePdfFromText(
            title || 'Tuned CV',
            String(content),
            templateCategory,
        );

        const filename = `${(title || 'tuned-cv').replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
        });

        res.end(buffer);
    }
}
