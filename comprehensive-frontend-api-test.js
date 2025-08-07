const BASE_URL = 'https://dharma-wanita-perdami.vercel.app';

async function comprehensiveAPITest() {
  console.log('🔍 COMPREHENSIVE FRONTEND API ANALYSIS');
  console.log('======================================');
  console.log('Testing ALL APIs used by frontend pages for consistency...\n');

  // Map of frontend pages and their required APIs
  const frontendPages = [
    {
      page: 'Homepage (/)',
      url: '/',
      apis: [
        { name: 'Stores API', endpoint: '/api/stores', critical: true },
        { name: 'Bundles API (Featured)', endpoint: '/api/bundles?featured=true&limit=6', critical: true },
        { name: 'User Stats', endpoint: '/api/users/stats', critical: false }
      ]
    },
    {
      page: 'Product Bundles (/bundles)',
      url: '/bundles',
      apis: [
        { name: 'All Bundles', endpoint: '/api/bundles', critical: true },
        { name: 'Stores for Filter', endpoint: '/api/stores', critical: true }
      ]
    },
    {
      page: 'Stores (/stores)',
      url: '/stores',
      apis: [
        { name: 'All Stores', endpoint: '/api/stores', critical: true },
        { name: 'Store Stats', endpoint: '/api/stores/stats', critical: false }
      ]
    },
    {
      page: 'Shopping Cart (/cart)',
      url: '/cart',
      apis: [
        { name: 'Bundles for Cart Items', endpoint: '/api/bundles', critical: true },
        { name: 'Bank Accounts', endpoint: '/api/banks', critical: true }
      ]
    },
    {
      page: 'User Profile (/profile)',
      url: '/profile',
      apis: [
        { name: 'User Profile', endpoint: '/api/profile', critical: true },
        { name: 'User Orders', endpoint: '/api/orders', critical: true },
        { name: 'Notifications', endpoint: '/api/notifications', critical: false }
      ]
    },
    {
      page: 'Orders (/orders)',
      url: '/orders',
      apis: [
        { name: 'User Orders', endpoint: '/api/orders', critical: true },
        { name: 'Order Details', endpoint: '/api/orders', critical: true }
      ]
    },
    {
      page: 'Individual Bundle (/bundles/[id])',
      url: '/bundles/test',
      apis: [
        { name: 'Bundle Details', endpoint: '/api/bundles', critical: true },
        { name: 'Related Bundles', endpoint: '/api/bundles?limit=4', critical: false }
      ]
    },
    {
      page: 'Individual Store (/stores/[id])',
      url: '/stores/test',
      apis: [
        { name: 'Store Details', endpoint: '/api/stores', critical: true },
        { name: 'Store Bundles', endpoint: '/api/bundles', critical: true }
      ]
    }
  ];

  const NUM_TESTS = 8; // Test each API multiple times
  const allResults = [];

  console.log(`📊 Testing ${frontendPages.length} frontend pages with ${NUM_TESTS} attempts each...\n`);

  for (const pageInfo of frontendPages) {
    console.log(`🎯 Testing: ${pageInfo.page}`);
    console.log(`📄 URL: ${BASE_URL}${pageInfo.url}`);
    console.log(`🔗 Required APIs: ${pageInfo.apis.length}`);
    console.log('─'.repeat(50));

    const pageResults = {
      page: pageInfo.page,
      url: pageInfo.url,
      apiResults: [],
      overallSuccess: 0,
      criticalSuccess: 0
    };

    for (const api of pageInfo.apis) {
      console.log(`\n🧪 Testing ${api.name} (${api.critical ? 'CRITICAL' : 'optional'}):`);
      
      let successCount = 0;
      const responseTimes = [];
      const errors = [];

      for (let i = 1; i <= NUM_TESTS; i++) {
        try {
          const start = Date.now();
          const response = await fetch(`${BASE_URL}${api.endpoint}`);
          const duration = Date.now() - start;

          if (response.ok) {
            const data = await response.json();
            
            // Validate response has expected data structure
            let hasValidData = false;
            if (data.bundles || data.data || data.status || data.message || data.totalUsers !== undefined) {
              hasValidData = true;
            }

            if (hasValidData) {
              successCount++;
              responseTimes.push(duration);
              process.stdout.write('✅ ');
            } else {
              process.stdout.write('⚠️ ');
              errors.push(`Empty data structure (attempt ${i})`);
            }
          } else {
            process.stdout.write('❌ ');
            errors.push(`HTTP ${response.status} (attempt ${i})`);
          }
        } catch (error) {
          process.stdout.write('💥 ');
          errors.push(`Network error: ${error.message} (attempt ${i})`);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      const successRate = (successCount / NUM_TESTS) * 100;
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;

      const apiResult = {
        name: api.name,
        endpoint: api.endpoint,
        critical: api.critical,
        successRate,
        successCount,
        totalTests: NUM_TESTS,
        avgResponseTime: avgResponseTime.toFixed(0),
        errors: errors.slice(0, 3) // Keep only first 3 errors
      };

      pageResults.apiResults.push(apiResult);

      console.log(`\n   📈 Success Rate: ${successRate.toFixed(1)}% (${successCount}/${NUM_TESTS})`);
      console.log(`   ⏱️  Average Response: ${avgResponseTime.toFixed(0)}ms`);
      
      if (errors.length > 0) {
        console.log(`   ⚠️  Sample Errors: ${errors.slice(0, 2).join(', ')}`);
      }

      // Status indicator
      const status = successRate >= 95 ? '🟢 EXCELLENT' : 
                     successRate >= 80 ? '🟡 GOOD' : 
                     successRate >= 50 ? '🟠 POOR' : '🔴 CRITICAL';
      console.log(`   ${status}`);
    }

    // Calculate page-level success rates
    const totalAPIs = pageInfo.apis.length;
    const criticalAPIs = pageInfo.apis.filter(api => api.critical).length;
    
    pageResults.overallSuccess = pageResults.apiResults.reduce((sum, api) => sum + api.successRate, 0) / totalAPIs;
    pageResults.criticalSuccess = pageResults.apiResults
      .filter(api => api.critical)
      .reduce((sum, api) => sum + api.successRate, 0) / criticalAPIs;

    allResults.push(pageResults);

    console.log(`\n📊 Page Summary:`);
    console.log(`   Overall API Success: ${pageResults.overallSuccess.toFixed(1)}%`);
    console.log(`   Critical API Success: ${pageResults.criticalSuccess.toFixed(1)}%`);
    console.log('\n' + '='.repeat(60) + '\n');
  }

  // Final comprehensive report
  console.log('📋 COMPREHENSIVE RESULTS SUMMARY');
  console.log('================================');

  allResults.forEach(result => {
    const pageStatus = result.criticalSuccess >= 95 ? '🟢' : 
                       result.criticalSuccess >= 80 ? '🟡' : 
                       result.criticalSuccess >= 50 ? '🟠' : '🔴';
    
    console.log(`${pageStatus} ${result.page.padEnd(30)} Critical: ${result.criticalSuccess.toFixed(1)}% | Overall: ${result.overallSuccess.toFixed(1)}%`);
  });

  // Identify problematic APIs
  console.log('\n🚨 PROBLEMATIC APIs (Success Rate < 80%):');
  console.log('==========================================');
  
  let hasProblems = false;
  allResults.forEach(pageResult => {
    pageResult.apiResults.forEach(api => {
      if (api.successRate < 80) {
        hasProblems = true;
        console.log(`❌ ${api.name} (${pageResult.page}): ${api.successRate.toFixed(1)}%`);
        console.log(`   Endpoint: ${api.endpoint}`);
        console.log(`   Critical: ${api.critical ? 'YES' : 'NO'}`);
        if (api.errors.length > 0) {
          console.log(`   Errors: ${api.errors.join(', ')}`);
        }
        console.log('');
      }
    });
  });

  if (!hasProblems) {
    console.log('✅ No problematic APIs found! All endpoints are performing well.');
  }

  // Overall system health
  const overallCriticalSuccess = allResults.reduce((sum, result) => sum + result.criticalSuccess, 0) / allResults.length;
  const overallTotalSuccess = allResults.reduce((sum, result) => sum + result.overallSuccess, 0) / allResults.length;

  console.log('\n🎯 SYSTEM HEALTH OVERVIEW:');
  console.log('==========================');
  console.log(`🔥 Critical APIs Success Rate: ${overallCriticalSuccess.toFixed(1)}%`);
  console.log(`📊 Overall APIs Success Rate: ${overallTotalSuccess.toFixed(1)}%`);

  if (overallCriticalSuccess >= 95) {
    console.log('🎉 EXCELLENT! Frontend data loading is highly reliable');
  } else if (overallCriticalSuccess >= 80) {
    console.log('👍 GOOD! Most frontend pages load data consistently');
  } else if (overallCriticalSuccess >= 50) {
    console.log('⚠️  MODERATE! Some pages may experience data loading issues');
  } else {
    console.log('🚨 CRITICAL! Frontend has significant data loading problems');
  }

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('===================');
  
  if (overallCriticalSuccess < 95) {
    console.log('🔧 Apply database retry logic to failing endpoints');
    console.log('⚡ Implement better error handling for API failures');
    console.log('🔄 Add client-side retry mechanisms for critical data');
  } else {
    console.log('✅ System is performing optimally');
    console.log('🎯 Continue monitoring for any degradation');
  }

  return allResults;
}

comprehensiveAPITest()
  .then(() => {
    console.log('\n✨ Comprehensive API analysis completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
