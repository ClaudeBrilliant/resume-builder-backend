import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { RewriteDto } from './dto/rewrite.dto';
import { ImproveDto } from './dto/improve.dto';
import { GenerateSummaryDto } from './dto/generate-summary.dto';
import { SuggestSkillsDto } from './dto/suggest-skills.dto';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async rewrite(rewriteDto: RewriteDto): Promise<{ rewritten: string }> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional resume writer. Rewrite the following bullet point to be more impactful, specific, and action-oriented. Keep it concise (one line).',
        },
        {
          role: 'user',
          content: rewriteDto.text,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    return {
      rewritten: completion.choices[0]?.message?.content || rewriteDto.text,
    };
  }

  async improve(improveDto: ImproveDto): Promise<{ improved: string }> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional resume writer. Improve the following text to be more professional, clear, and impactful while maintaining the original meaning.',
        },
        {
          role: 'user',
          content: improveDto.text,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return {
      improved: completion.choices[0]?.message?.content || improveDto.text,
    };
  }

  async generateSummary(
    generateSummaryDto: GenerateSummaryDto,
  ): Promise<{ summary: string }> {
    const skillsText = generateSummaryDto.skills
      ? `Key skills: ${generateSummaryDto.skills.join(', ')}. `
      : '';

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional resume writer. Generate a compelling professional summary (2-3 sentences) based on the provided experience and skills. Make it impactful and tailored for job applications.',
        },
        {
          role: 'user',
          content: `${skillsText}Experience: ${generateSummaryDto.experience}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    return {
      summary: completion.choices[0]?.message?.content || '',
    };
  }

  async suggestSkills(
    suggestSkillsDto: SuggestSkillsDto,
  ): Promise<{ skills: string[] }> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a career advisor. Based on the following work experience, suggest 5-8 relevant technical and soft skills. Return only a comma-separated list of skills, nothing else.',
        },
        {
          role: 'user',
          content: suggestSkillsDto.experience,
        },
      ],
      temperature: 0.5,
      max_tokens: 100,
    });

    const skillsText = completion.choices[0]?.message?.content || '';
    const skills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    return { skills };
  }
}

