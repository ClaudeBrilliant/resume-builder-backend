import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { RewriteDto } from './dto/rewrite.dto';
import { ImproveDto } from './dto/improve.dto';
import { GenerateSummaryDto } from './dto/generate-summary.dto';
import { SuggestSkillsDto } from './dto/suggest-skills.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { EnhanceBulletsDto } from './dto/enhance-bullets.dto';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('models')
  @Public()
  @ApiOperation({ summary: 'List available AI models for the configured provider' })
  async listModels() {
    return this.aiService.listModels();
  }

  @Get('provider-info')
  @Public()
  @ApiOperation({ summary: 'Get current AI provider information' })
  async getProviderInfo() {
    return this.aiService.getProviderInfo();
  }

  @Post('rewrite')
  @ApiOperation({ summary: 'Rewrite a single bullet point to be more impactful' })
  rewrite(@Body() rewriteDto: RewriteDto) {
    return this.aiService.rewrite(rewriteDto);
  }

  @Post('improve')
  @ApiOperation({ summary: 'Improve wording for professional impact' })
  improve(@Body() improveDto: ImproveDto) {
    return this.aiService.improve(improveDto);
  }

  @Post('enhance-bullets')
  @ApiOperation({ summary: 'Enhance multiple bullet points at once (batch operation)' })
  async enhanceBulletPoints(@Body() enhanceBulletsDto: EnhanceBulletsDto) {
    const result = await this.aiService.enhanceBulletPoints(enhanceBulletsDto.bullets);
    return {
      success: true,
      data: result,
      message: `Enhanced ${result.length} bullet points successfully`,
    };
  }

  @Post('generate-summary')
  @ApiOperation({ summary: 'Generate professional summary based on experience and skills' })
  generateSummary(@Body() generateSummaryDto: GenerateSummaryDto) {
    return this.aiService.generateSummary(generateSummaryDto);
  }

  @Post('suggest-skills')
  @ApiOperation({ summary: 'Suggest relevant skills based on work experience' })
  suggestSkills(@Body() suggestSkillsDto: SuggestSkillsDto) {
    return this.aiService.suggestSkills(suggestSkillsDto);
  }
}