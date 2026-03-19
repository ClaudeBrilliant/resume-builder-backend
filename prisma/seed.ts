import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultTemplates = [
  {
    name: 'Modern',
    category: 'MODERN' as const,
    thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=500&fit=crop',
    structure: {
      sections: ['header', 'summary', 'experience', 'education', 'skills'],
      layout: 'single-column',
    },
    isPremium: false,
  },
  {
    name: 'Professional',
    category: 'PROFESSIONAL' as const,
    thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=500&fit=crop',
    structure: {
      sections: ['header', 'summary', 'experience', 'education', 'skills'],
      layout: 'two-column',
    },
    isPremium: false,
  },
  {
    name: 'Creative',
    category: 'CREATIVE' as const,
    thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=500&fit=crop',
    structure: {
      sections: ['header', 'summary', 'experience', 'education', 'skills'],
      layout: 'creative',
    },
    isPremium: true,
  },
];

async function main() {
  const existing = await prisma.template.count();
  if (existing > 0) {
    console.log(`Templates already exist (${existing}). Skipping seed.`);
    return;
  }

  for (const template of defaultTemplates) {
    await prisma.template.create({
      data: template,
    });
  }

  console.log(`Created ${defaultTemplates.length} default templates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
