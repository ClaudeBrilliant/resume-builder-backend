import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Headers,
  RawBodyRequest,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-checkout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  createCheckout(
    @CurrentUser() user: any,
    @Body() createCheckoutDto: CreateCheckoutDto,
  ) {
    return this.paymentsService.createCheckout(user.id, createCheckoutDto);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription' })
  getSubscription(@CurrentUser() user: any) {
    return this.paymentsService.getSubscription(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel subscription' })
  cancelSubscription(@CurrentUser() user: any) {
    return this.paymentsService.cancelSubscription(user.id);
  }
}

