// Import ES modules properly
const { PrismaClient } = require('@prisma/client');

const prismaGlobal = globalThis.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prismaGlobal;

async function checkBanks() {
  console.log('🏦 Checking Bank Accounts in Database...');
  
  const prisma = prismaGlobal;
  
  try {
    const banks = await prisma.bankAccount.findMany({
      include: {
        _count: true
      }
    });
    
    console.log(`Found ${banks.length} bank accounts:`);
    banks.forEach((bank, index) => {
      console.log(`${index + 1}. ${bank.name} (${bank.accountNumber}) - Active: ${bank.isActive}`);
    });
    
    // Check settings
    const settings = await prisma.siteSettings.findMany({
      where: {
        key: {
          in: ['SINGLE_BANK_MODE', 'SINGLE_BANK_ID']
        }
      }
    });
    
    console.log('\n🛠️ Bank Settings:');
    settings.forEach(setting => {
      console.log(`${setting.key}: ${setting.value}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking banks:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBanks().catch(console.error);
