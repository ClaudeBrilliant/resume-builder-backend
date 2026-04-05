import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ where: { plan: 'PRO' } });
  let added = 0;
  for (const user of users) {
    const sub = await prisma.subscription.findFirst({ where: { userId: user.id } });
    if (!sub) {
      console.log(`Adding missing subscription for ${user.email}`);
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'PRO',
          status: 'ACTIVE',
          currentPeriodEnd,
        }
      });
      added++;
    }
  }
  console.log(`Added ${added} subscriptions`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
