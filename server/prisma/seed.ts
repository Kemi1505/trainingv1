// prisma/seed.ts
//
// Usage:
//   SEED_SUPERADMIN_EMAIL=you@example.com SEED_SUPERADMIN_PASSWORD='a-strong-password' npx prisma db seed
//
// Add to package.json first:
//   "prisma": { "seed": "ts-node prisma/seed.ts" }
// (needs ts-node: npm i -D ts-node)

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_SUPERADMIN_EMAIL;
  const password = process.env.SEED_SUPERADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Set SEED_SUPERADMIN_EMAIL and SEED_SUPERADMIN_PASSWORD before running the seed.',
    );
  }
  if (password.length < 8) {
    throw new Error('SEED_SUPERADMIN_PASSWORD must be at least 8 characters.');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User ${email} already exists (role: ${existing.role}) — skipping.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const superadmin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: 'SUPERADMIN',
    },
    select: { id: true, email: true, role: true },
  });

  console.log('Superadmin created:', superadmin);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
