import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userPlan: 'FREE' | 'PRO') {
    const templates = await this.prisma.template.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Filter premium templates for free users
    if (userPlan === 'FREE') {
      return templates.filter((template) => !template.isPremium);
    }

    return templates;
  }

  async findOne(id: string, userPlan: 'FREE' | 'PRO') {
    const template = await this.prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.isPremium && userPlan === 'FREE') {
      throw new NotFoundException('Template not found');
    }

    return template;
  }
}

