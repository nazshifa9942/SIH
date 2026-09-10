const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);

  await prisma.user.update({
    where: {
      email: 'demo@sih26006.com',
    },
    data: {
      passwordHash,
    },
  });

  console.log('PASSWORD UPDATED SUCCESSFULLY');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });