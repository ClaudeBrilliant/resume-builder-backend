import { Module } from '@nestjs/common';
import { CvTuningController } from './cv-tuning.controller';
import { CvTuningService } from './cv-tuning.service';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [AiModule],
    controllers: [CvTuningController],
    providers: [CvTuningService],
})
export class CvTuningModule { }
