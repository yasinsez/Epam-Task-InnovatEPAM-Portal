import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(pwd) {
  return bcrypt.hash(pwd, 12);
}

async function main() {
  const categories = [
    { name: 'Process Improvement', slug: 'process-improvement', order: 1 },
    { name: 'Technology', slug: 'technology', order: 2 },
    { name: 'Cost Reduction', slug: 'cost-reduction', order: 3 },
    { name: 'Company Culture', slug: 'company-culture', order: 4 },
    { name: 'Other', slug: 'other', order: 5 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      create: { ...cat, isActive: true },
      update: {},
    });
  }
  console.log('Seeded categories');

  const devUsers = [
    { email: 'submitter@epam.com', name: 'Submitter User', role: 'SUBMITTER', password: 'Submitter@12345' },
    { email: 'evaluator@epam.com', name: 'Evaluator User', role: 'EVALUATOR', password: 'Evaluator@12345' },
    { email: 'admin@epam.com', name: 'Admin User', role: 'ADMIN', password: 'Admin@12345' },
  ];

  for (const u of devUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          passwordHash: await hashPassword(u.password),
          role: u.role,
        },
      });
      console.log(`Created dev user: ${u.email}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
