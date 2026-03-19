import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UploadService } from '../upload/upload.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
    private emailService: EmailService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateProfileDto.email },
      });

      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
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

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Send password changed email
    await this.emailService.sendPasswordChangedEmail(user.email);

    return { message: 'Password changed successfully' };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Upload new avatar
    const avatarUrl = await this.uploadService.uploadAvatar(file);

    // Delete old avatar if exists
    if (user.avatar) {
      const oldPublicId = this.uploadService.extractPublicId(user.avatar);
      if (oldPublicId) {
        await this.uploadService.deleteFile(oldPublicId);
      }
    }

    // Update user with new avatar URL
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
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

    return updatedUser;
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete user (cascade will delete resumes and subscriptions)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Account deleted successfully' };
  }

  async getUserStats(userId: string) {
    const [resumeCount, completedResumes, subscription] = await Promise.all([
      this.prisma.resume.count({
        where: { userId },
      }),
      this.prisma.resume.count({
        where: {
          userId,
          isComplete: true,
        },
      }),
      this.prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      resumeCount,
      completedResumes,
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
    };
  }
}
