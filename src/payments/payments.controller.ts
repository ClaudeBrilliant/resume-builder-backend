import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize payment for plan upgrade' })
  async initializePayment(
    @CurrentUser() user: any,
    @Body() body: { plan: string; amount: number },
  ) {
    const result = await this.paymentsService.initializePayment(
      user.id,
      body.plan,
      body.amount,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify payment after redirect' })
  async verifyPayment(@Query('reference') reference: string) {
    const result = await this.paymentsService.verifyPayment(reference);

    return {
      success: true,
      data: result,
    };
  }

  @Post('verify-paystack')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify payment from frontend callback' })
  async verifyPaystack(@Body() body: { reference: string; plan: string }) {
    const result = await this.paymentsService.verifyPayment(body.reference);

    return {
      success: true,
      data: result,
    };
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Paystack webhook endpoint' })
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    // Get raw body
    const rawBody = req.rawBody?.toString() || JSON.stringify(req.body);

    // Verify signature
    const isValid = this.paymentsService.verifyPaystackSignature(
      rawBody,
      signature,
    );

    if (!isValid) {
      return { status: 'error', message: 'Invalid signature' };
    }

    // Process webhook
    await this.paymentsService.handleWebhook(req.body);

    return { status: 'success' };
  }
}