import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Anthropic } from '@anthropic-ai/sdk';
import { RewriteDto } from './dto/rewrite.dto';
import { ImproveDto } from './dto/improve.dto';
import { GenerateSummaryDto } from './dto/generate-summary.dto';
import { SuggestSkillsDto } from './dto/suggest-skills.dto';
import { OptimizeCvDto } from './dto/optimize-cv.dto';

type Provider = 'openai' | 'gemini' | 'anthropic';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private provider: Provider;
  private openai?: OpenAI;
  private genAI?: GoogleGenerativeAI;
  private anthropic?: Anthropic;
  private openaiModel: string;
  private geminiModel: string;
  private anthropicModel: string;

  constructor(private configService: ConfigService) {
    this.provider = (this.configService.get<string>('AI_PROVIDER') || 'anthropic') as Provider;
    this.openaiModel = this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo';
    this.geminiModel = this.configService.get<string>('GEMINI_PRO_MODEL') || 'gemini-pro';
    this.anthropicModel = this.configService.get<string>('ANTHROPIC_MODEL') || 'claude-sonnet-4-20250514';

    // Initialize OpenAI
    if (this.provider === 'openai') {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!apiKey) {
        this.logger.error('OPENAI_API_KEY is not set but AI_PROVIDER=openai');
      } else {
        this.openai = new OpenAI({ apiKey });
        this.logger.log('✅ OpenAI initialized');
      }
    }

    // Initialize Gemini
    else if (this.provider === 'gemini') {
      const googleKey = this.configService.get<string>('GOOGLE_API_KEY');
      if (!googleKey) {
        this.logger.error('GOOGLE_API_KEY is not set but AI_PROVIDER=gemini');
      } else {
        this.genAI = new GoogleGenerativeAI(googleKey);
        this.logger.log('✅ Gemini initialized');
      }
    }

    // Initialize Anthropic (Claude)
    else if (this.provider === 'anthropic') {
      const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
      if (!apiKey) {
        this.logger.error('ANTHROPIC_API_KEY is not set but AI_PROVIDER=anthropic');
      } else {
        this.anthropic = new Anthropic({ apiKey });
        this.logger.log('✅ Anthropic (Claude) initialized');
      }
    }
  }

  private async callOpenAI(
    messages: any[],
    opts: { model?: string; temperature?: number; max_tokens?: number } = {}
  ) {
    if (!this.openai) throw new Error('OpenAI client not initialized');
    const model = opts.model || this.openaiModel;
    const completion = await this.openai.chat.completions.create({
      model,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 150,
    });
    return completion.choices[0]?.message?.content || '';
  }

  private async callGemini(
    prompt: string,
    opts: { model?: string; temperature?: number; maxTokens?: number } = {}
  ) {
    if (!this.genAI) throw new Error('Gemini client not initialized');
    const model = this.genAI.getGenerativeModel({ model: opts.model || this.geminiModel });
    const result = await model.generateContent(prompt, {
      temperature: opts.temperature ?? 0.7,
    } as any);
    return (result?.response?.text && (await result.response.text())) || '';
  }

  private async callAnthropic(
    system: string,
    userMessage: string,
    opts: { model?: string; temperature?: number; max_tokens?: number } = {}
  ) {
    if (!this.anthropic) throw new Error('Anthropic client not initialized');

    const response = await this.anthropic.messages.create({
      model: opts.model || this.anthropicModel,
      max_tokens: opts.max_tokens ?? 1024,
      temperature: opts.temperature ?? 0.7,
      system,
      messages: [
        { role: 'user', content: userMessage }
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new BadRequestException('Unexpected response format from AI');
    }

    return content.text.trim();
  }

  async rewrite(rewriteDto: RewriteDto): Promise<{ rewritten: string }> {
    const system = 'You are a professional resume writer. Rewrite the following bullet point to be more impactful, specific, and action-oriented. Use strong action verbs, add quantifiable metrics when possible, and keep it concise (1-2 lines). Return ONLY the rewritten bullet point, no explanations.';

    try {
      // OpenAI
      if (this.provider === 'openai') {
        const messages = [
          { role: 'system', content: system },
          { role: 'user', content: rewriteDto.text },
        ];
        const rewritten = await this.callOpenAI(messages, {
          model: this.openaiModel,
          temperature: 0.7,
          max_tokens: 150
        });
        return { rewritten: rewritten || rewriteDto.text };
      }

      // Anthropic (Claude)
      if (this.provider === 'anthropic') {
        const rewritten = await this.callAnthropic(system, rewriteDto.text, {
          model: this.anthropicModel,
          temperature: 0.7,
          max_tokens: 200,
        });
        return { rewritten: rewritten || rewriteDto.text };
      }

      // Gemini
      const prompt = `${system}\n\n${rewriteDto.text}`;
      const rewritten = await this.callGemini(prompt, {
        model: this.geminiModel,
        temperature: 0.7,
        maxTokens: 150
      });
      return { rewritten: rewritten || rewriteDto.text };

    } catch (err) {
      this.logger.error('AI rewrite failed', err);
      return { rewritten: rewriteDto.text };
    }
  }

  async improve(improveDto: ImproveDto): Promise<{ improved: string }> {
    const system = 'You are a professional resume writer. Improve the following text to be more professional, clear, and impactful while maintaining the original meaning. Keep it concise. Return ONLY the improved text, no explanations.';

    try {
      // OpenAI
      if (this.provider === 'openai') {
        const messages = [
          { role: 'system', content: system },
          { role: 'user', content: improveDto.text },
        ];
        const improved = await this.callOpenAI(messages, {
          model: this.openaiModel,
          temperature: 0.7,
          max_tokens: 200
        });
        return { improved: improved || improveDto.text };
      }

      // Anthropic (Claude)
      if (this.provider === 'anthropic') {
        const improved = await this.callAnthropic(system, improveDto.text, {
          model: this.anthropicModel,
          temperature: 0.7,
          max_tokens: 300,
        });
        return { improved: improved || improveDto.text };
      }

      // Gemini
      const prompt = `${system}\n\n${improveDto.text}`;
      const improved = await this.callGemini(prompt, {
        model: this.geminiModel,
        temperature: 0.7,
        maxTokens: 200
      });
      return { improved: improved || improveDto.text };

    } catch (err) {
      this.logger.error('AI improve failed', err);
      return { improved: improveDto.text };
    }
  }

  async generateSummary(generateSummaryDto: GenerateSummaryDto): Promise<{ summary: string }> {
    const skillsText = generateSummaryDto.skills
      ? `Key skills: ${generateSummaryDto.skills.join(', ')}. `
      : '';
    const system = 'You are a professional resume writer. Generate a compelling professional summary (3-4 sentences, max 80 words) based on the provided experience and skills. Make it impactful, specific, and tailored for job applications. Use confident, professional language. Return ONLY the summary, no explanations.';
    const user = `${skillsText}Experience: ${generateSummaryDto.experience}`;

    try {
      // OpenAI
      if (this.provider === 'openai') {
        const messages = [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ];
        const summary = await this.callOpenAI(messages, {
          model: this.openaiModel,
          temperature: 0.8,
          max_tokens: 200
        });
        return { summary: summary || '' };
      }

      // Anthropic (Claude)
      if (this.provider === 'anthropic') {
        const summary = await this.callAnthropic(system, user, {
          model: this.anthropicModel,
          temperature: 0.8,
          max_tokens: 300,
        });
        return { summary: summary || '' };
      }

      // Gemini
      const prompt = `${system}\n\n${user}`;
      const summary = await this.callGemini(prompt, {
        model: this.geminiModel,
        temperature: 0.8,
        maxTokens: 200
      });
      return { summary: summary || '' };

    } catch (err) {
      this.logger.error('AI generateSummary failed', err);
      return { summary: '' };
    }
  }

  async suggestSkills(suggestSkillsDto: SuggestSkillsDto): Promise<{ skills: string[] }> {
    const system = 'You are a career advisor. Based on the following work experience, suggest 5-8 relevant technical and professional skills. Return ONLY a comma-separated list of skills, nothing else. No explanations, no numbering, just: Skill1, Skill2, Skill3, etc.';

    try {
      // OpenAI
      if (this.provider === 'openai') {
        const messages = [
          { role: 'system', content: system },
          { role: 'user', content: suggestSkillsDto.experience }
        ];
        const skillsText = await this.callOpenAI(messages, {
          model: this.openaiModel,
          temperature: 0.5,
          max_tokens: 150
        });
        const skills = (skillsText || '')
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        return { skills };
      }

      // Anthropic (Claude)
      if (this.provider === 'anthropic') {
        const skillsText = await this.callAnthropic(system, suggestSkillsDto.experience, {
          model: this.anthropicModel,
          temperature: 0.5,
          max_tokens: 200,
        });
        const skills = (skillsText || '')
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        return { skills };
      }

      // Gemini
      const prompt = `${system}\n\n${suggestSkillsDto.experience}`;
      const skillsText = await this.callGemini(prompt, {
        model: this.geminiModel,
        temperature: 0.5,
        maxTokens: 150
      });
      const skills = (skillsText || '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      return { skills };

    } catch (err) {
      this.logger.error('AI suggestSkills failed', err);
      return { skills: [] };
    }
  }

  /**
   * Enhance multiple bullet points at once (batch operation)
   */
  async enhanceBulletPoints(bullets: string[]): Promise<Array<{
    original: string;
    enhanced: string;
    improvements: string[];
  }>> {
    const system = `You are a professional resume writer. Enhance these bullet points to be more impactful.

Rules:
- Start with strong action verbs
- Add quantifiable metrics when possible
- Keep each bullet 1-2 lines max
- Focus on achievements, not duties
- Return ONLY valid JSON, no markdown

Return this EXACT format:
[
  {
    "original": "original text",
    "enhanced": "enhanced text",
    "improvements": ["improvement 1", "improvement 2"]
  }
]`;

    const userMessage = bullets.map((b, i) => `${i + 1}. ${b}`).join('\n');

    try {
      // Anthropic (Claude) - Best for structured output
      if (this.provider === 'anthropic') {
        const response = await this.callAnthropic(system, userMessage, {
          temperature: 0.7,
          max_tokens: 2000,
        });

        // Extract JSON
        let jsonText = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const jsonMatch = jsonText.match(/\[[\s\S]*\]/);

        if (!jsonMatch) {
          throw new BadRequestException('Could not parse AI response');
        }

        return JSON.parse(jsonMatch[0]);
      }

      // OpenAI fallback
      if (this.provider === 'openai') {
        const messages = [
          { role: 'system', content: system },
          { role: 'user', content: userMessage }
        ];
        const response = await this.callOpenAI(messages, {
          temperature: 0.7,
          max_tokens: 2000,
        });

        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new BadRequestException('Could not parse AI response');
        }

        return JSON.parse(jsonMatch[0]);
      }

      // Gemini fallback
      const prompt = `${system}\n\n${userMessage}`;
      const response = await this.callGemini(prompt, {
        temperature: 0.7,
        maxTokens: 2000,
      });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new BadRequestException('Could not parse AI response');
      }

      return JSON.parse(jsonMatch[0]);

    } catch (err) {
      this.logger.error('AI enhanceBulletPoints failed', err);
      // Return original bullets on error
      return bullets.map(b => ({
        original: b,
        enhanced: b,
        improvements: ['Enhancement failed - original text preserved']
      }));
    }
  }

  /**
   * List available models for the configured provider
   */
  async listModels(): Promise<any> {
    if (this.provider === 'anthropic') {
      // Anthropic doesn't have a public models list API
      return {
        provider: 'anthropic',
        models: [
          'claude-sonnet-4-20250514',
          'claude-opus-4-20250514',
          'claude-haiku-4-20250514',
        ],
      };
    }

    if (this.provider === 'gemini') {
      const apiKey = this.configService.get<string>('GOOGLE_API_KEY');
      if (!apiKey) {
        throw new Error('GOOGLE_API_KEY is not set');
      }
      const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to list Gemini models: ${res.status} ${text}`);
      }
      return res.json();
    }

    if (this.provider === 'openai') {
      if (!this.openai) throw new Error('OpenAI client not initialized');
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to list OpenAI models: ${res.status} ${text}`);
      }
      return res.json();
    }

    throw new Error('Unknown AI provider');
  }

  /**
   * Get current provider info
   */
  getProviderInfo() {
    return {
      provider: this.provider,
      model: this.provider === 'openai'
        ? this.openaiModel
        : this.provider === 'gemini'
          ? this.geminiModel
          : this.anthropicModel,
      available: !!(
        (this.provider === 'openai' && this.openai) ||
        (this.provider === 'gemini' && this.genAI) ||
        (this.provider === 'anthropic' && this.anthropic)
      ),
    };
  }

  /**
   * Optimize the entire CV based on a job description
   */
  async optimizeCv(optimizeCvDto: OptimizeCvDto): Promise<{
    personalInfo: any;
    experiences: any[];
    skills: string[];
    suggestions: string[];
  }> {
    const { personalInfo, experiences, skills, jobDescription } = optimizeCvDto;

    const system = `You are an expert ATS (Applicant Tracking System) optimizer and professional resume writer.
Your goal is to optimize a candidate's resume for a specific job description.

Rules:
1. Tailor the professional summary to highlight relevance to the JD.
2. Rewrite experience bullet points to focus on achievements and keywords from the JD.
3. Suggest adding 3-5 keywords/skills that are prominent in the JD but missing from the resume.
4. Return ONLY valid JSON.

Return this EXACT format:
{
  "personalInfo": {
    "summary": "updated summary"
  },
  "experiences": [
    {
      "id": "original_exp_id",
      "bullets": ["updated bullet 1", "updated bullet 2"]
    }
  ],
  "skills": ["added_skill_1", "added_skill_2"],
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

    const userMessage = JSON.stringify({
      personalInfo: { summary: personalInfo.summary },
      experiences: experiences.map(e => ({
        id: e.id,
        title: e.title,
        company: e.company,
        bullets: e.bullets
      })),
      skills,
      jobDescription
    });

    try {
      let response = '';
      if (this.provider === 'anthropic') {
        response = await this.callAnthropic(system, userMessage, {
          temperature: 0.7,
          max_tokens: 3000,
        });
      } else if (this.provider === 'openai') {
        response = await this.callOpenAI([
          { role: 'system', content: system },
          { role: 'user', content: userMessage }
        ], {
          temperature: 0.7,
          max_tokens: 3000,
        });
      } else {
        response = await this.callGemini(`${system}\n\n${userMessage}`, {
          temperature: 0.7,
          maxTokens: 3000,
        });
      }

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse AI response');
      }

      const result = JSON.parse(jsonMatch[0]);

      // Merge back into the original structure
      const updatedExperiences = experiences.map(exp => {
        const optimized = result.experiences?.find(e => e.id === exp.id);
        return optimized ? { ...exp, bullets: optimized.bullets } : exp;
      });

      return {
        personalInfo: { ...personalInfo, summary: result.personalInfo?.summary || personalInfo.summary },
        experiences: updatedExperiences,
        skills: [...new Set([...skills, ...(result.skills || [])])],
        suggestions: result.suggestions || []
      };

    } catch (err) {
      this.logger.error('AI optimizeCv failed', err);
      throw new BadRequestException('AI optimization failed');
    }
  }

  /**
   * Tune an existing CV based on a job description
   */
  async tuneCv(cvText: string, jobDescription: string): Promise<any> {
    const system = `You are an expert ATS (Applicant Tracking System) optimizer and professional resume writer.
Your goal is to "tune" an existing CV text to match a specific job description.

Rules:
1. Analyze the CV and JD to identify keywords, skills, and experiences that should be emphasized.
2. Rephrase experience bullet points to better align with the job requirements.
3. Suggest adding 3-5 keywords or skills that are missing but likely possessed by the candidate (inferred from experience).
4. Identify irrelevant content that could be minimized.
5. Provide a side-by-side comparison of major changes.
6. In tunedContent, use plain text only. Do NOT use markdown formatting (no **bold**, no headers with #, no numbered markdown, no markdown tables).
7. For lists in tunedContent, use simple bullet points that begin with "- ".
8. Return ONLY valid JSON.

Return this EXACT format:
{
  "originalContent": "the original CV text provided",
  "tunedContent": "the full tuned and optimized CV text",
  "changes": [
    {
      "category": "Experience" | "Skills" | "Summary" | "Other",
      "original": "original text snippet",
      "suggested": "suggested replacement snippet",
      "reason": "why this change was made"
    }
  ],
  "missingKeywords": ["keyword1", "keyword2"],
  "highlightedSkills": ["skill1", "skill2"]
}`;

    const userMessage = JSON.stringify({
      cvText,
      jobDescription
    });

    try {
      let response = '';
      if (this.provider === 'anthropic') {
        response = await this.callAnthropic(system, userMessage, {
          temperature: 0.7,
          max_tokens: 4000,
        });
      } else if (this.provider === 'openai') {
        response = await this.callOpenAI([
          { role: 'system', content: system },
          { role: 'user', content: userMessage }
        ], {
          temperature: 0.7,
          max_tokens: 4000,
        });
      } else {
        response = await this.callGemini(`${system}\n\n${userMessage}`, {
          temperature: 0.7,
          maxTokens: 4000,
        });
      }

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse AI response');
      }

      return JSON.parse(jsonMatch[0]);

    } catch (err) {
      this.logger.error('AI tuneCv failed', err);
      throw new BadRequestException('AI tuning failed');
    }
  }
}