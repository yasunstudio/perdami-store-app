const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyBundlePricing() {
  try {
    console.log('📊 Bundle Pricing Verification Report');
    console.log('='.repeat(80));

    const bundles = await prisma.productBundle.findMany({
      select: {
        id: true,
        name: true,
        costPrice: true,
        sellingPrice: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`Total Bundles: ${bundles.length}\n`);

    bundles.forEach((bundle, index) => {
      const margin = bundle.costPrice && bundle.sellingPrice 
        ? ((bundle.sellingPrice - bundle.costPrice) / bundle.costPrice * 100).toFixed(1)
        : 0;
      const profit = bundle.sellingPrice - bundle.costPrice;

      console.log(`${(index + 1).toString().padStart(2, '0')}. ${bundle.name}`);
      console.log(`    💰 Cost: Rp ${bundle.costPrice?.toLocaleString() || 'N/A'}`);
      console.log(`    🏷️  Selling: Rp ${bundle.sellingPrice?.toLocaleString() || 'N/A'}`);
      console.log(`    📈 Margin: ${margin}%`);
      console.log(`    💵 Profit: Rp ${profit?.toLocaleString() || 'N/A'}`);
      console.log('');
    });

    // Calculate summary stats
    const validBundles = bundles.filter(b => b.costPrice && b.sellingPrice);
    const totalCost = validBundles.reduce((sum, b) => sum + b.costPrice, 0);
    const totalSelling = validBundles.reduce((sum, b) => sum + b.sellingPrice, 0);
    const totalProfit = totalSelling - totalCost;
    const avgMargin = validBundles.length > 0 
      ? (totalProfit / totalCost * 100).toFixed(1)
      : 0;

    console.log('='.repeat(80));
    console.log('📈 SUMMARY STATISTICS:');
    console.log(`• Bundles with pricing: ${validBundles.length}/${bundles.length}`);
    console.log(`• Total cost value: Rp ${totalCost.toLocaleString()}`);
    console.log(`• Total selling value: Rp ${totalSelling.toLocaleString()}`);
    console.log(`• Total profit potential: Rp ${totalProfit.toLocaleString()}`);
    console.log(`• Average margin: ${avgMargin}%`);
    console.log(`• Average profit per bundle: Rp ${validBundles.length > 0 ? Math.round(totalProfit / validBundles.length).toLocaleString() : 0}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyBundlePricing();
