import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import * as mammoth from 'mammoth';
import { Express } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
// pdf-parse is published as CommonJS/ESM; require(...) may return the function or an object with a `default` export.
// Normalize to a callable function to avoid "pdfParse is not a function" runtime errors.
let pdfParse: any;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const _pdf = require('pdf-parse');
    pdfParse = _pdf && typeof _pdf === 'object' && 'default' in _pdf ? _pdf.default : _pdf;
} catch (e) {
    // If the module can't be loaded, keep pdfParse undefined and let the runtime throw a clear error later.
    // Logger isn't available at module scope; errors will be logged when parsing is attempted.
    pdfParse = undefined;
}

@Injectable()
export class CvTuningService {
    private readonly logger = new Logger(CvTuningService.name);

    constructor(private readonly aiService: AiService) { }

    async tuneCv(file: Express.Multer.File, jobDescription: string) {
        let text = '';

        try {
            this.logger.log(`Received file with mimetype=${file?.mimetype} size=${file?.buffer?.length ?? 0}`);
            this.logger.log(`pdfParse available: ${typeof pdfParse === 'function'}`);
            if (file.mimetype === 'application/pdf') {
                const data = await pdfParse(file.buffer);
                text = data.text;
            } else if (
                file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.mimetype === 'application/msword'
            ) {
                const result = await mammoth.extractRawText({ buffer: file.buffer });
                text = result.value;
            } else if (file.mimetype === 'text/plain') {
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
