const testAnalyticsNow = async () => {
  try {
    console.log('📊 Testing Dashboard Analytics NOW...\n');
    
    const response = await fetch('https://dharma-wanita-perdami.vercel.app/api/admin/dashboard');
    const data = await response.json();
    
    console.log('📈 CURRENT DASHBOARD DATA:');
    console.log('='.repeat(40));
    
    const stats = data.stats;
    
    console.log('📊 Totals:');
    console.log(`   Users: ${stats.totalUsers}`);
    console.log(`   Orders: ${stats.totalOrders}`);
    console.log(`   Products: ${stats.totalProducts}`);
    console.log(`   Stores: ${stats.totalStores}`);
    console.log('');
    
    console.log('📈 Growth Rates:');
    console.log(`   User: ${stats.userGrowthRate}%`);
    console.log(`   Order: ${stats.orderGrowthRate}%`);
    console.log(`   Product: ${stats.productGrowthRate}%`);
    console.log(`   Store: ${stats.storeGrowthRate}%`);
    console.log('');
    
    // The key check: Total Orders vs Order Growth
    console.log('🔍 INCONSISTENCY CHECK:');
    console.log(`   Total Orders: ${stats.totalOrders}`);
    console.log(`   Order Growth: ${stats.orderGrowthRate}%`);
    
    if (stats.totalOrders === 0 && stats.orderGrowthRate > 0) {
      console.log('❌ STILL INCONSISTENT: 0 orders but showing positive growth');
      console.log('   May need more time for deployment or additional fixes');
    } else if (stats.totalOrders === 0 && stats.orderGrowthRate === 0) {
      console.log('✅ CONSISTENT: 0 orders with 0% growth - makes sense!');
    } else {
      console.log('✅ CONSISTENT: Orders and growth rate are logical');
    }
    
    // Check hardcoded values
    const hardcodedCheck = [
      { name: 'User', rate: stats.userGrowthRate, hardcoded: 12.5 },
      { name: 'Order', rate: stats.orderGrowthRate, hardcoded: 15.7 },
      { name: 'Product', rate: stats.productGrowthRate, hardcoded: 8.3 },
      { name: 'Store', rate: stats.storeGrowthRate, hardcoded: 5.2 }
    ];
    
    console.log('');
    console.log('🎯 HARDCODED VALUES:');
    let hasHardcoded = false;
    hardcodedCheck.forEach(item => {
      if (item.rate === item.hardcoded) {
        console.log(`   ❌ ${item.name}: ${item.rate}% (still hardcoded)`);
        hasHardcoded = true;
      } else {
        console.log(`   ✅ ${item.name}: ${item.rate}% (calculated)`);
      }
    });
    
    console.log('');
    if (!hasHardcoded) {
      console.log('🎉 SUCCESS: All growth rates are now calculated from database!');
    } else {
      console.log('⏳ Some values still hardcoded - deployment may be in progress');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

testAnalyticsNow();
