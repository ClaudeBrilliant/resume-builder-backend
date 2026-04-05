import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Templates')
@Controller('templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) { }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all templates' })
  findAll(@CurrentUser() user: any) {
    const plan = user?.plan || 'FREE';
    return this.templatesService.findAll(plan);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.templatesService.findOne(id, user.plan);
  }
}

