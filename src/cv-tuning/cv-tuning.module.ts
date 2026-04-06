import { Module } from '@nestjs/common';
import { CvTuningController } from './cv-tuning.controller';
import { CvTuningService } from './cv-tuning.service';
import { AiModule } from '../ai/ai.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
    imports: [AiModule, PdfModule],
    controllers: [CvTuningController],
    providers: [CvTuningService],
})
export class CvTuningModule { }
