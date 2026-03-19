import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UploadAvatarDto } from './dto/upload-avatar.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get user statistics' })
  getStats(@CurrentUser() user: any) {
    return this.usersService.getUserStats(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update user profile' })
  updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change password' })
  changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, changePasswordDto);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload avatar image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadAvatar(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(user.id, file);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete user account' })
  deleteAccount(@CurrentUser() user: any) {
    return this.usersService.deleteAccount(user.id);
  }
}
