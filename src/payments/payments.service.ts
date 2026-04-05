import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private paystackSecretKey: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.paystackSecretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
  }

  /**
   * Verify Paystack webhook signature
   */
  verifyPaystackSignature(body: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.paystackSecretKey)
      .update(body)
      .digest('hex');

    return hash === signature;
  }

  /**
   * Handle Paystack webhook events
   */
  async handleWebhook(event: any) {
    this.logger.log(`Processing Paystack webhook: ${event.event}`);

    switch (event.event) {
      case 'charge.success':
        await this.handleChargeSuccess(event.data);
        break;

      case 'subscription.create':
        await this.handleSubscriptionCreate(event.data);
        break;

      case 'subscription.disable':
        await this.handleSubscriptionDisable(event.data);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.event}`);
    }
  }

  /**
   * Handle successful payment
   */
  private async handleChargeSuccess(data: any) {
    const { reference, metadata, amount } = data;

    if (!metadata?.userId || !metadata?.plan) {
      this.logger.error('Missing userId or plan in payment metadata');
      return;
    }

    const userId = metadata.userId;
    const plan = metadata.plan as 'FREE' | 'PRO'
    // Update user's plan
    await this.prisma.user.update({
      where: { id: userId },
      data: { plan },
    });

    // Create subscription record
    await this.prisma.subscription.create({
      data: {
        userId,
        paystackReference: reference,
        plan,
        status: 'ACTIVE',
      },
    });

    this.logger.log(`✅ User ${userId} upgraded to ${plan} plan`);
  }

  /**
   * Handle subscription creation
   */
  private async handleSubscriptionCreate(data: any) {
    const { customer, subscription_code, plan } = data;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: customer.email },
    });

    if (!user) {
      this.logger.error(`User not found for email: ${customer.email}`);
      return;
    }

    // Map Paystack plan to our plan
    const userPlan = this.mapPaystackPlanToUserPlan(plan.name);

    // Update user
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        plan: userPlan,
        paystackId: subscription_code,
      },
    });

    this.logger.log(`✅ Subscription created for ${user.email} - ${userPlan}`);
  }

  /**
   * Handle subscription cancellation
   */
  private async handleSubscriptionDisable(data: any) {
    const { subscription_code } = data;

    const user = await this.prisma.user.findFirst({
      where: { paystackId: subscription_code },
    });

    if (!user) {
      this.logger.error(`User not found for subscription: ${subscription_code}`);
      return;
    }

    // Downgrade to free
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        plan: 'FREE',
        paystackId: null,
      },
    });

    this.logger.log(`✅ Subscription cancelled for ${user.email}`);
  }

  /**
   * Map Paystack plan names to our plan enum
   */
  private mapPaystackPlanToUserPlan(paystackPlan: string): 'FREE' | 'PRO' {
    const planMap: Record<string, 'FREE' | 'PRO'> = {
      'cv-builder-basic': 'PRO',
      'cv-builder-premium': 'PRO',
    };

    return planMap[paystackPlan.toLowerCase()] || 'FREE';
  }

  /**
   * Initialize payment
   */
  async initializePayment(userId: string, plan: string, amount: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: amount * 100, // Convert to kobo
        metadata: {
          userId: user.id,
          plan,
          userName: user.name,
        },
        callback_url: `${this.configService.get('FRONTEND_URL')}/payment/callback`,
      }),
    });

    const data = await response.json();

    if (!data.status) {
      throw new BadRequestException('Failed to initialize payment');
    }

    return {
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    };
  }

  /**
   * Verify payment
   */
  async verifyPayment(reference: string) {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${this.paystackSecretKey}`,
        },
      }
    );

    const data = await response.json();

    if (!data.status || data.data.status !== 'success') {
      throw new BadRequestException('Payment verification failed');
    }

    // Update user plan
    const { userId, plan } = data.data.metadata;

    await this.prisma.user.update({
      where: { id: userId },
      data: { plan },
    });

    return {
      status: 'success',
      message: 'Payment verified successfully',
      plan,
    };
  }
}