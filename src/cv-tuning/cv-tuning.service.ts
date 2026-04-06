import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import * as mammoth from 'mammoth';
import { Express } from 'express';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParseModule = require('pdf-parse');

@Injectable()
export class CvTuningService {
    private readonly logger = new Logger(CvTuningService.name);

    constructor(private readonly aiService: AiService) { }

    private resolveFileType(file: Express.Multer.File): 'pdf' | 'doc' | 'txt' | 'unknown' {
        const mime = file?.mimetype;
        const ext = path.extname(file?.originalname || '').toLowerCase();

        if (mime === 'application/pdf' || ext === '.pdf') return 'pdf';
        if (
            mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mime === 'application/msword' ||
            ext === '.docx' ||
            ext === '.doc'
        ) return 'doc';
        if (mime === 'text/plain' || ext === '.txt') return 'txt';
        return 'unknown';
    }

    private async extractPdfText(buffer: Buffer): Promise<string> {
        // pdf-parse v2 API: new PDFParse({ data }).getText()
        const PDFParseCtor =
            pdfParseModule?.PDFParse ||
            pdfParseModule?.default?.PDFParse;

        if (typeof PDFParseCtor === 'function') {
            const parser = new PDFParseCtor({ data: buffer });
            try {
                const result = await parser.getText();
                return result?.text || '';
            } finally {
                if (typeof parser.destroy === 'function') {
                    await parser.destroy();
                }
            }
        }

        // Backward compatibility for older pdf-parse versions.
        const legacyFn =
            (typeof pdfParseModule === 'function' && pdfParseModule) ||
            (typeof pdfParseModule?.default === 'function' && pdfParseModule.default);

        if (typeof legacyFn === 'function') {
            const result = await legacyFn(buffer);
            return result?.text || '';
        }

        throw new Error('Unsupported pdf-parse export format');
    }

    async tuneCv(file: Express.Multer.File, jobDescription: string) {
        let text = '';

        try {
            this.logger.log(`Received file with mimetype=${file?.mimetype} size=${file?.buffer?.length ?? 0}`);
            const fileType = this.resolveFileType(file);

            if (fileType === 'pdf') {
                text = await this.extractPdfText(file.buffer);
            } else if (fileType === 'doc') {
                const result = await mammoth.extractRawText({ buffer: file.buffer });
                text = result.value;
            } else if (fileType === 'txt') {
                text = file.buffer.toString('utf-8');
            } else {
                throw new BadRequestException('Unsupported file format. Please upload PDF, DOCX, or TXT.');
            }
        } catch (error) {
            this.logger.error('File parsing failed', error);
            if (error instanceof BadRequestException) throw error;
            throw new BadRequestException('Failed to parse the CV file.');
        }

        if (!text.trim()) {
            throw new BadRequestException('The uploaded CV file appears to be empty.');
        }

        return this.aiService.tuneCv(text, jobDescription);
    }
}
