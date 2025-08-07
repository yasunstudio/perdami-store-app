const BASE_URL = 'https://dharma-wanita-perdami.vercel.app';

// Test configuration
const NUM_ATTEMPTS = 5;
const DELAY_BETWEEN_ATTEMPTS = 1000; // 1 second

// Function to test an endpoint multiple times
async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 Testing ${name} (${NUM_ATTEMPTS} attempts)...`);
  
  const results = [];
  let successCount = 0;
  
  for (let i = 1; i <= NUM_ATTEMPTS; i++) {
    try {
      const start = Date.now();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
      
      const response = await fetch(`${BASE_URL}${url}`, {
        signal: controller.signal,
        ...options
      });
      
      clearTimeout(timeoutId);
      const duration = Date.now() - start;
      
      if (response.ok) {
        successCount++;
        const data = await response.json();
        console.log(`✅ Attempt ${i}: SUCCESS (${duration}ms)`);
        
        // Log data length/count for verification
        if (data?.bundles) {
          console.log(`   📦 Bundles count: ${data.bundles.length}`);
        } else if (data?.stores) {
          console.log(`   🏪 Stores count: ${data.stores.length}`);
        } else if (data?.banks) {
          console.log(`   🏦 Banks count: ${data.banks.length}`);
        } else if (data?.message) {
          console.log(`   💬 Message: ${data.message}`);
        } else if (data?.status) {
          console.log(`   📊 Status: ${data.status}`);
        }
        
        results.push({
          attempt: i,
          success: true,
          status: response.status,
          duration,
          dataSize: JSON.stringify(data).length
        });
      } else {
        console.log(`❌ Attempt ${i}: HTTP ${response.status}`);
        const errorData = await response.json().catch(() => ({}));
        console.log(`   Error: ${errorData.error || 'Unknown error'}`);
        
        results.push({
          attempt: i,
          success: false,
          status: response.status,
          error: errorData.error || 'HTTP Error'
        });
      }
    } catch (error) {
      console.log(`❌ Attempt ${i}: ERROR - ${error.message}`);
      
      results.push({
        attempt: i,
        success: false,
        error: error.message,
        status: 'NETWORK_ERROR'
      });
    }
    
    // Wait between attempts
    if (i < NUM_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_ATTEMPTS));
    }
  }
  
  // Calculate statistics
  const successRate = (successCount / NUM_ATTEMPTS) * 100;
  const avgDuration = results
    .filter(r => r.success && r.duration)
    .reduce((sum, r) => sum + r.duration, 0) / successCount || 0;
  
  console.log(`\n📊 ${name} Results:`);
  console.log(`   Success Rate: ${successRate.toFixed(1)}% (${successCount}/${NUM_ATTEMPTS})`);
  if (avgDuration > 0) {
    console.log(`   Average Response Time: ${avgDuration.toFixed(0)}ms`);
  }
  
  return {
    name,
    successRate,
    successCount,
    totalAttempts: NUM_ATTEMPTS,
    avgDuration: avgDuration.toFixed(0),
    results
  };
}

async function runTests() {
  console.log('🚀 Testing Improved API Endpoints with Database Retry Logic');
  console.log('=' .repeat(60));
  
  const testResults = [];
  
  // Test public endpoints
  testResults.push(
    await testEndpoint('Health Check', '/api/health')
  );
  
  testResults.push(
    await testEndpoint('User Stats', '/api/users/stats')
  );
  
  testResults.push(
    await testEndpoint('Stores API (Improved)', '/api/stores')
  );
  
  testResults.push(
    await testEndpoint('Bundles API (Improved)', '/api/bundles?limit=5')
  );
  
  // Test with authentication for admin endpoints
  // Note: Admin endpoints will fail without proper auth, but we can test if they return proper error responses
  testResults.push(
    await testEndpoint('Admin Banks (Improved)', '/api/admin/banks')
  );
  
  // Summary
  console.log('\n\n📈 OVERALL SUMMARY');
  console.log('=' .repeat(60));
  
  testResults.forEach(result => {
    const status = result.successRate >= 80 ? '✅' : 
                   result.successRate >= 50 ? '⚠️' : '❌';
    console.log(`${status} ${result.name}: ${result.successRate}% success (${result.avgDuration}ms avg)`);
  });
  
  const overallSuccess = testResults.reduce((sum, r) => sum + r.successCount, 0);
  const overallTotal = testResults.reduce((sum, r) => sum + r.totalAttempts, 0);
  const overallRate = (overallSuccess / overallTotal) * 100;
  
  console.log(`\n🎯 OVERALL SUCCESS RATE: ${overallRate.toFixed(1)}% (${overallSuccess}/${overallTotal})`);
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  const failingEndpoints = testResults.filter(r => r.successRate < 80);
  if (failingEndpoints.length === 0) {
    console.log('✅ All endpoints are performing well!');
  } else {
    console.log('📋 Endpoints that need attention:');
    failingEndpoints.forEach(endpoint => {
      console.log(`   - ${endpoint.name}: ${endpoint.successRate}% success rate`);
    });
  }
  
  return testResults;
}

// Run the tests
runTests()
  .then(() => {
    console.log('\n✨ Testing completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
