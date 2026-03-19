import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';

@Injectable()
export class ResumesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createResumeDto: CreateResumeDto) {
    // Verify template exists
    const template = await this.prisma.template.findUnique({
      where: { id: createResumeDto.templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Check if user has access to premium template
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (template.isPremium && user?.plan !== 'PRO') {
      throw new ForbiddenException('Premium template requires PRO plan');
    }

    return this.prisma.resume.create({
      data: {
        title: createResumeDto.title,
        templateId: createResumeDto.templateId,
        userId,
        content: {},
      },
      include: {
        template: true,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
            thumbnail: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id },
      include: {
        template: true,
      },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    if (resume.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return resume;
  }

  async update(id: string, userId: string, updateResumeDto: UpdateResumeDto) {
    const resume = await this.findOne(id, userId);

    return this.prisma.resume.update({
      where: { id },
      data: updateResumeDto,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
            thumbnail: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    await this.prisma.resume.delete({
      where: { id },
    });

    return { message: 'Resume deleted successfully' };
  }

  async duplicate(id: string, userId: string) {
    const resume = await this.findOne(id, userId);

    return this.prisma.resume.create({
      data: {
        title: `${resume.title} (Copy)`,
        templateId: resume.templateId,
        userId,
        content: resume.content,
        isComplete: false,
        completionScore: 0,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
            thumbnail: true,
          },
        },
      },
    });
  }
}

