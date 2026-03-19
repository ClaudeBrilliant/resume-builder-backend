import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
  }

  async createCheckout(userId: string, createCheckoutDto: CreateCheckoutDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const priceId = this.configService.get<string>(
      createCheckoutDto.plan === 'PRO' ? 'STRIPE_PRO_PRICE_ID' : 'STRIPE_FREE_PRICE_ID',
    );

    if (!priceId) {
      throw new BadRequestException('Price configuration not found');
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
        },
      });

      customerId = customer.id;

      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${this.configService.get<string>('FRONTEND_URL')}/dashboard?success=true`,
      cancel_url: `${this.configService.get<string>('FRONTEND_URL')}/pricing?canceled=true`,
      metadata: {
        userId,
      },
    });

    return { url: session.url };
  }

  async handleWebhook(payload: any, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;

    if (!userId) {
      console.error('No userId in session metadata');
      return;
    }

    const subscriptionId = session.subscription as string;

    if (!subscriptionId) {
      console.error('No subscription ID in session');
      return;
    }

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

    await this.updateUserSubscription(userId, subscription);
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error(`User not found for customer: ${customerId}`);
      return;
    }

    await this.updateUserSubscription(user.id, subscription);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error(`User not found for customer: ${customerId}`);
      return;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { plan: 'FREE' },
    });

    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELED',
      },
    });
  }

  private async updateUserSubscription(userId: string, subscription: Stripe.Subscription) {
    const priceId = subscription.items.data[0]?.price.id;
    const isPro = priceId === this.configService.get<string>('STRIPE_PRO_PRICE_ID');

    // Update user plan
    await this.prisma.user.update({
      where: { id: userId },
      data: { plan: isPro ? 'PRO' : 'FREE' },
    });

    // Update or create subscription record
    await this.prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      update: {
        status: this.mapStripeStatus(subscription.status),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        plan: isPro ? 'PRO' : 'FREE',
      },
      create: {
        userId,
        stripeSubscriptionId: subscription.id,
        plan: isPro ? 'PRO' : 'FREE',
        status: this.mapStripeStatus(subscription.status),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  private mapStripeStatus(status: Stripe.Subscription.Status): 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'INCOMPLETE' {
    switch (status) {
      case 'active':
        return 'ACTIVE';
      case 'canceled':
      case 'unpaid':
        return 'CANCELED';
      case 'past_due':
        return 'PAST_DUE';
      case 'incomplete':
      case 'incomplete_expired':
        return 'INCOMPLETE';
      default:
        return 'INCOMPLETE';
    }
  }

  async getSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    return subscription || null;
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    if (!subscription) {
      throw new NotFoundException('Active subscription not found');
    }

    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    return { message: 'Subscription will be canceled at the end of the current period' };
  }
}

