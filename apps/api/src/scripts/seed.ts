import bcrypt from 'bcryptjs';
import { prisma } from '../database/prisma.js';
import { EXPERT_REGISTRY } from '../modules/ai/experts/expert.registry.js';

async function seed() {
  console.log('🌱 Starting database seed...');

  // 1. Create Default Admin & Demo User
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@humanizer.ai' },
    update: {},
    create: {
      email: 'demo@humanizer.ai',
      name: 'Demo Author',
      passwordHash,
      role: 'USER',
    },
  });
  console.log('👤 Demo user created:', demoUser.email);

  // 2. Populate Expert Definitions
  for (const exp of Object.values(EXPERT_REGISTRY)) {
    await prisma.expert.upsert({
      where: { name: exp.title },
      update: {
        description: exp.description,
        systemPrompt: exp.systemPrompt,
        temperature: exp.recommendedTemperature,
      },
      create: {
        name: exp.title,
        expertType: exp.type,
        domainType: exp.domain,
        description: exp.description,
        systemPrompt: exp.systemPrompt,
        temperature: exp.recommendedTemperature,
      },
    });
  }
  console.log('🧠 Expert models seeded.');

  console.log('✨ Seed completed successfully.');
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
