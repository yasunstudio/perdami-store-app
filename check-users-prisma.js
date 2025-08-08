import { createPrismaClient } from './src/lib/prisma-serverless.js';

async function checkUsersDataPrisma() {
  const prisma = createPrismaClient();

  try {
    console.log('🔗 Checking users data with Prisma');

    // Check users count
    const userCount = await prisma.user.count();
    console.log(`\n📊 Total users count: ${userCount}`);

    if (userCount > 0) {
      // Get sample users
      const users = await prisma.user.findMany({
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

      console.log('\n👥 Users in database:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
      });
    } else {
      console.log('❌ No users found in database!');
    }

  } catch (error) {
    console.error('❌ Error checking users data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsersDataPrisma();
