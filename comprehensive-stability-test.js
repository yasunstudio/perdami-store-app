const BASE_URL = 'https://dharma-wanita-perdami.vercel.app';

async function comprehensiveTest() {
  console.log('🎯 COMPREHENSIVE API STABILITY TEST');
  console.log('===================================');
  console.log('Testing critical endpoints multiple times to verify consistency...\n');
  
  const endpoints = [
    { name: 'Health Check', url: '/api/health' },
    { name: 'User Stats', url: '/api/users/stats' },
    { name: 'Stores API', url: '/api/stores' },
    { name: 'Bundles API', url: '/api/bundles?limit=5' }
  ];
  
  const NUM_ATTEMPTS = 10; // More attempts to test consistency
  const allResults = [];
  
  for (const endpoint of endpoints) {
    console.log(`🧪 Testing ${endpoint.name} (${NUM_ATTEMPTS} attempts)...`);
    
    let successCount = 0;
    const responseTimes = [];
    
    for (let i = 1; i <= NUM_ATTEMPTS; i++) {
      try {
        const start = Date.now();
        const response = await fetch(`${BASE_URL}${endpoint.url}`);
        const duration = Date.now() - start;
        
        if (response.ok) {
          successCount++;
          responseTimes.push(duration);
          process.stdout.write('✅ ');
        } else {
          process.stdout.write('❌ ');
        }
      } catch (error) {
        process.stdout.write('💥 ');
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    const successRate = (successCount / NUM_ATTEMPTS) * 100;
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
    
    const status = successRate >= 90 ? '🟢' : 
                   successRate >= 80 ? '🟡' : 
                   successRate >= 50 ? '🟠' : '🔴';
    
    console.log(`\n   ${status} Success Rate: ${successRate.toFixed(1)}% (${successCount}/${NUM_ATTEMPTS})`);
    console.log(`   ⏱️  Average Response: ${avgResponseTime.toFixed(0)}ms`);
    console.log('');
    
    allResults.push({
      name: endpoint.name,
      successRate,
      successCount,
      totalAttempts: NUM_ATTEMPTS,
      avgResponseTime: avgResponseTime.toFixed(0)
    });
  }
  
  // Summary
  console.log('📊 FINAL SUMMARY');
  console.log('================');
  
  let totalSuccess = 0;
  let totalAttempts = 0;
  
  allResults.forEach(result => {
    totalSuccess += result.successCount;
    totalAttempts += result.totalAttempts;
    
    const status = result.successRate >= 90 ? '🟢' : 
                   result.successRate >= 80 ? '🟡' : 
                   result.successRate >= 50 ? '🟠' : '🔴';
    
    console.log(`${status} ${result.name.padEnd(15)} ${result.successRate.toString().padStart(5)}% (${result.avgResponseTime}ms)`);
  });
  
  const overallSuccessRate = (totalSuccess / totalAttempts) * 100;
  console.log('\n' + '='.repeat(50));
  console.log(`🎯 OVERALL STABILITY: ${overallSuccessRate.toFixed(1)}% (${totalSuccess}/${totalAttempts})`);
  
  if (overallSuccessRate >= 90) {
    console.log('🎉 EXCELLENT! APIs are highly stable and consistent.');
  } else if (overallSuccessRate >= 80) {
    console.log('👍 GOOD! APIs are mostly stable with minor issues.');
  } else if (overallSuccessRate >= 50) {
    console.log('⚠️  MODERATE! APIs need optimization.');
  } else {
    console.log('🚨 POOR! APIs require immediate attention.');
  }
  
  console.log('\n✨ Comprehensive test completed!');
}

comprehensiveTest()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
