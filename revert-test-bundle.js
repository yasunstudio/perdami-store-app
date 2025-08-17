const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function revertTestBundle() {
  try {
    const bundleId = 'cmecac1ui000cinfl8dbq5nic';
    
    console.log('🔄 Reverting test bundle to original values...');
    
    // Revert to original values
    const revertUpdate = {
      costPrice: 80000,
      sellingPrice: 109000,
      description: "Paket Bebek Frozen 2 Pack berisi dua ekor bebek berbumbu khas Bebek Si Kembar, disimpan beku agar tetap segar dan lezat, praktis untuk stok di rumah."
    };
    
    const revertedBundle = await prisma.productBundle.update({
      where: { id: bundleId },
      data: revertUpdate,
      select: {
        id: true,
        name: true,
        costPrice: true,
        sellingPrice: true,
        description: true
      }
    });
    
    console.log('✅ Bundle reverted to original state:');
    console.log(`💰 Cost Price: Rp ${revertedBundle.costPrice.toLocaleString()}`);
    console.log(`🏷️  Selling Price: Rp ${revertedBundle.sellingPrice.toLocaleString()}`);
    console.log(`📝 Description: ${revertedBundle.description.substring(0, 80)}...`);
    
  } catch (error) {
    console.error('❌ Revert failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

revertTestBundle();
