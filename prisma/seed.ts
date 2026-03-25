import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const hash = await bcrypt.hash('paloma2024', 10);
  await prisma.admin_users.upsert({
    where: { email: 'admin@palomahomeservices.com' },
    update: {},
    create: {
      email: 'admin@palomahomeservices.com',
      password_hash: hash,
      name: 'Admin',
      role: 'admin',
    },
  });

  console.log('Seed complete: admin@palomahomeservices.com / paloma2024');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
