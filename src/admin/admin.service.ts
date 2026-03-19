import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // Analytics
  async getStats() {
    const [totalUsers, totalResumes, totalTemplates, totalSubscriptions, activeSubscriptions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.resume.count(),
      this.prisma.template.count(),
      this.prisma.subscription.count(),
      this.prisma.subscription.count({
        where: { status: 'ACTIVE' },
      }),
    ]);

    const usersByPlan = await this.prisma.user.groupBy({
      by: ['plan'],
      _count: true,
    });

    const recentUsers = await this.prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        createdAt: true,
      },
    });

    return {
      overview: {
        totalUsers,
        totalResumes,
        totalTemplates,
        totalSubscriptions,
        activeSubscriptions,
      },
      usersByPlan: usersByPlan.map((item) => ({
        plan: item.plan,
        count: item._count,
      })),
      recentUsers,
    };
  }

  // User Management
  async getAllUsers(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          plan: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              resumes: true,
              subscriptions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        plan: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        resumes: {
          take: 10,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            isComplete: true,
            completionScore: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        plan: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }

  // Resume Management
  async getAllResumes(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { user: { email: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {};

    const [resumes, total] = await Promise.all([
      this.prisma.resume.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          template: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.resume.count({ where }),
    ]);

    return {
      resumes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteResume(id: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    await this.prisma.resume.delete({
      where: { id },
    });

    return { message: 'Resume deleted successfully' };
  }

  // Template Management
  async createTemplate(createTemplateDto: CreateTemplateDto) {
    return this.prisma.template.create({
      data: createTemplateDto,
    });
  }

  async updateTemplate(id: string, updateTemplateDto: UpdateTemplateDto) {
    const template = await this.prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return this.prisma.template.update({
      where: { id },
      data: updateTemplateDto,
    });
  }

  async deleteTemplate(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Check if template is being used
    const resumeCount = await this.prisma.resume.count({
      where: { templateId: id },
    });

    if (resumeCount > 0) {
      throw new NotFoundException(
        `Cannot delete template. It is being used by ${resumeCount} resume(s)`,
      );
    }

    await this.prisma.template.delete({
      where: { id },
    });

    return { message: 'Template deleted successfully' };
  }

  // Subscription Management
  async getAllSubscriptions(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count(),
    ]);

    return {
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}


