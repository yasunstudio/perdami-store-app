const BASE_URL = 'https://dharma-wanita-perdami.vercel.app';

async function quickAPIHealthCheck() {
  console.log('🎯 QUICK API HEALTH CHECK');
  console.log('=========================');
  console.log('Testing critical APIs for immediate status...\n');

  const criticalAPIs = [
    { name: 'Homepage Stores', endpoint: '/api/stores', page: 'Homepage' },
    { name: 'Featured Bundles', endpoint: '/api/bundles?featured=true&limit=6', page: 'Homepage' },
    { name: 'All Bundles', endpoint: '/api/bundles', page: 'Product Catalog' },
    { name: 'Bank Accounts', endpoint: '/api/banks', page: 'Shopping Cart' },
    { name: 'Store Stats', endpoint: '/api/stores/stats', page: 'Store Pages' },
    { name: 'User Stats', endpoint: '/api/users/stats', page: 'General' }
  ];

  const NUM_TESTS = 5;
  const results = [];

  for (const api of criticalAPIs) {
    console.log(`🧪 Testing ${api.name} (${api.page}):`);
    
    let successCount = 0;
    const responseTimes = [];

    for (let i = 1; i <= NUM_TESTS; i++) {
      try {
        const start = Date.now();
        const response = await fetch(`${BASE_URL}${api.endpoint}`);
        const duration = Date.now() - start;

        if (response.ok) {
          const data = await response.json();
          if (data.bundles || data.data || data.banks || data.status || data.totalUsers !== undefined || data.totalStores !== undefined) {
            successCount++;
            responseTimes.push(duration);
            process.stdout.write('✅ ');
          } else {
            process.stdout.write('⚠️ ');
          }
        } else {
          process.stdout.write('❌ ');
        }
      } catch (error) {
        process.stdout.write('💥 ');
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const successRate = (successCount / NUM_TESTS) * 100;
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    console.log(`\n   📊 Success: ${successRate.toFixed(1)}% (${successCount}/${NUM_TESTS})`);
    console.log(`   ⏱️  Avg Time: ${avgResponseTime.toFixed(0)}ms`);

    const status = successRate >= 90 ? '🟢 EXCELLENT' : 
                   successRate >= 80 ? '🟡 GOOD' : 
                   successRate >= 50 ? '🟠 POOR' : '🔴 CRITICAL';
    console.log(`   ${status}\n`);

    results.push({
      name: api.name,
      page: api.page,
      successRate,
      avgResponseTime: avgResponseTime.toFixed(0)
    });
  }

  // Summary
  console.log('📋 SUMMARY REPORT');
  console.log('================');
  
  results.forEach(result => {
    const status = result.successRate >= 90 ? '🟢' : 
                   result.successRate >= 80 ? '🟡' : 
                   result.successRate >= 50 ? '🟠' : '🔴';
    
    console.log(`${status} ${result.name.padEnd(20)} ${result.successRate.toString().padStart(5)}% (${result.avgResponseTime}ms) - ${result.page}`);
  });

  const overallSuccess = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;
  console.log('\n' + '='.repeat(50));
  console.log(`🎯 OVERALL SUCCESS RATE: ${overallSuccess.toFixed(1)}%`);
  
  if (overallSuccess >= 90) {
    console.log('🎉 EXCELLENT! All critical APIs are highly stable');
  } else if (overallSuccess >= 80) {
    console.log('👍 GOOD! Most APIs are working well');
  } else {
    console.log('⚠️  NEEDS ATTENTION! Some APIs need improvement');
  }

  // Pages affected
  const stablePages = results.filter(r => r.successRate >= 90).map(r => r.page);
  const unstablePages = results.filter(r => r.successRate < 80).map(r => r.page);

  if (stablePages.length > 0) {
    console.log(`\n✅ STABLE PAGES: ${[...new Set(stablePages)].join(', ')}`);
  }
  if (unstablePages.length > 0) {
    console.log(`\n⚠️  UNSTABLE PAGES: ${[...new Set(unstablePages)].join(', ')}`);
  }
}

quickAPIHealthCheck()
  .then(() => {
    console.log('\n✨ Quick health check completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  });
