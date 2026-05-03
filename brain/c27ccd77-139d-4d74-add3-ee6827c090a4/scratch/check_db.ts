import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  const users = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log(`User Count: ${count}`);
  console.log('Users:', users);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
