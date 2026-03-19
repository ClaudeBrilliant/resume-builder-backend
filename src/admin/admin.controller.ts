import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
    );
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user' })
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.adminService.updateUser(id, updateUserDto);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('resumes')
  @ApiOperation({ summary: 'Get all resumes with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  getAllResumes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllResumes(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
    );
  }

  @Delete('resumes/:id')
  @ApiOperation({ summary: 'Delete resume' })
  deleteResume(@Param('id') id: string) {
    return this.adminService.deleteResume(id);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create template' })
  createTemplate(@Body() createTemplateDto: CreateTemplateDto) {
    return this.adminService.createTemplate(createTemplateDto);
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: 'Update template' })
  updateTemplate(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return this.adminService.updateTemplate(id, updateTemplateDto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete template' })
  deleteTemplate(@Param('id') id: string) {
    return this.adminService.deleteTemplate(id);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Get all subscriptions with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAllSubscriptions(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getAllSubscriptions(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }
}


