import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [ConfigModule, ThrottlerModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}

