import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ResumesService } from './resumes.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PdfService } from '../pdf/pdf.service';

@ApiTags('Resumes')
@Controller('resumes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ResumesController {
  constructor(
    private readonly resumesService: ResumesService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new resume' })
  create(@CurrentUser() user: any, @Body() createResumeDto: CreateResumeDto) {
    return this.resumesService.create(user.id, createResumeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all resumes for current user' })
  findAll(@CurrentUser() user: any) {
    return this.resumesService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resume by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.resumesService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update resume' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateResumeDto: UpdateResumeDto,
  ) {
    return this.resumesService.update(id, user.id, updateResumeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete resume' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.resumesService.remove(id, user.id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate resume' })
  duplicate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.resumesService.duplicate(id, user.id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download resume as PDF' })
  async download(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const resume = await this.resumesService.findOne(id, user.id);
    const buffer = await this.pdfService.generatePdf(resume);

    const filename = `${resume.title.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    res.end(buffer);
  }
}

