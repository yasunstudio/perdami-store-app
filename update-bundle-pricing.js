const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Function to generate realistic pricing based on bundle name
function generatePricing(bundleName) {
  const name = bundleName.toLowerCase();
  
  let baseCost;
  let marginPercent;
  
  // Determine base cost and margin based on bundle type
  if (name.includes('premium') || name.includes('deluxe') || name.includes('vip')) {
    baseCost = Math.floor(Math.random() * (150000 - 120000) + 120000); // 120k-150k
    marginPercent = 0.35 + Math.random() * 0.10; // 35-45% margin
  } else if (name.includes('standard') || name.includes('regular')) {
    baseCost = Math.floor(Math.random() * (100000 - 80000) + 80000); // 80k-100k
    marginPercent = 0.30 + Math.random() * 0.10; // 30-40% margin
  } else if (name.includes('basic') || name.includes('starter') || name.includes('ekonomi')) {
    baseCost = Math.floor(Math.random() * (70000 - 50000) + 50000); // 50k-70k
    marginPercent = 0.25 + Math.random() * 0.10; // 25-35% margin
  } else if (name.includes('family') || name.includes('keluarga')) {
    baseCost = Math.floor(Math.random() * (200000 - 150000) + 150000); // 150k-200k
    marginPercent = 0.30 + Math.random() * 0.10; // 30-40% margin
  } else {
    // Default pricing for unknown types
    baseCost = Math.floor(Math.random() * (100000 - 60000) + 60000); // 60k-100k
    marginPercent = 0.30 + Math.random() * 0.10; // 30-40% margin
  }
  
  const costPrice = Math.round(baseCost / 1000) * 1000; // Round to nearest 1000
  const sellingPrice = Math.round((costPrice * (1 + marginPercent)) / 1000) * 1000; // Round to nearest 1000
  const actualMargin = ((sellingPrice - costPrice) / costPrice * 100).toFixed(1);
  
  return {
    costPrice,
    sellingPrice,
    margin: parseFloat(actualMargin)
  };
}

async function updateBundlePricing() {
  try {
    console.log('🔄 Mengupdate pricing untuk bundles...');

    // Get all bundles
    const bundles = await prisma.productBundle.findMany({
      select: {
        id: true,
        name: true,
        costPrice: true,
        sellingPrice: true,
      }
    });

    console.log(`📦 Ditemukan ${bundles.length} bundles`);

    let updatedCount = 0;
    let skippedCount = 0;
    let totalProfit = 0;

    for (const bundle of bundles) {
      // Check if bundle already has pricing set
      if (bundle.costPrice && bundle.sellingPrice && bundle.costPrice > 0 && bundle.sellingPrice > 0) {
        const existingMargin = ((bundle.sellingPrice - bundle.costPrice) / bundle.costPrice * 100).toFixed(1);
        console.log(`⏭️  Skipped ${bundle.name}: Cost=${bundle.costPrice.toLocaleString()}, Selling=${bundle.sellingPrice.toLocaleString()}, Margin=${existingMargin}%`);
        skippedCount++;
        continue;
      }

      // Generate new pricing
      const pricing = generatePricing(bundle.name);
      
      await prisma.productBundle.update({
        where: { id: bundle.id },
        data: {
          costPrice: pricing.costPrice,
          sellingPrice: pricing.sellingPrice,
        }
      });
      
      const profit = pricing.sellingPrice - pricing.costPrice;
      totalProfit += profit;
      
      console.log(`✅ Updated ${bundle.name}:`);
      console.log(`   💰 Cost Price: Rp ${pricing.costPrice.toLocaleString()}`);
      console.log(`   🏷️  Selling Price: Rp ${pricing.sellingPrice.toLocaleString()}`);
      console.log(`   📈 Margin: ${pricing.margin}%`);
      console.log(`   💵 Profit: Rp ${profit.toLocaleString()}`);
      console.log('');
      
      updatedCount++;
    }

    console.log('='.repeat(50));
    console.log('📊 SUMMARY REPORT:');
    console.log(`✅ Updated bundles: ${updatedCount}`);
    console.log(`⏭️  Skipped bundles: ${skippedCount}`);
    console.log(`💰 Total profit potential: Rp ${totalProfit.toLocaleString()}`);
    console.log(`📈 Average profit per bundle: Rp ${updatedCount > 0 ? Math.round(totalProfit / updatedCount).toLocaleString() : 0}`);
    console.log('='.repeat(50));
    console.log('✨ Selesai mengupdate bundle pricing!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateBundlePricing();
