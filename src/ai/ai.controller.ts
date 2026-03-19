import { Controller, Post, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { RewriteDto } from './dto/rewrite.dto';
import { ImproveDto } from './dto/improve.dto';
import { GenerateSummaryDto } from './dto/generate-summary.dto';
import { SuggestSkillsDto } from './dto/suggest-skills.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('rewrite')
  @ApiOperation({ summary: 'Rewrite bullet points to be more impactful' })
  rewrite(@Body() rewriteDto: RewriteDto) {
    return this.aiService.rewrite(rewriteDto);
  }

  @Post('improve')
  @ApiOperation({ summary: 'Improve wording for professional impact' })
  improve(@Body() improveDto: ImproveDto) {
    return this.aiService.improve(improveDto);
  }

  @Post('generate-summary')
  @ApiOperation({ summary: 'Generate professional summary' })
  generateSummary(@Body() generateSummaryDto: GenerateSummaryDto) {
    return this.aiService.generateSummary(generateSummaryDto);
  }

  @Post('suggest-skills')
  @ApiOperation({ summary: 'Suggest skills based on experience' })
  suggestSkills(@Body() suggestSkillsDto: SuggestSkillsDto) {
    return this.aiService.suggestSkills(suggestSkillsDto);
  }
}

