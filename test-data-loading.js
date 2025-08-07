// Comprehensive data loading consistency test
async function testDataLoadingConsistency() {
    console.log('🔍 Testing Data Loading Consistency Issues...\n');
    
    const baseUrl = 'https://dharma-wanita-perdami.vercel.app';
    const testEndpoints = [
        '/api/bundles',
        '/api/stores', 
        '/api/admin/dashboard',
        '/api/admin/banks',
        '/api/admin/orders',
        '/api/users/stats'
    ];
    
    // Function to test an endpoint multiple times
    async function testEndpointConsistency(endpoint, attempts = 5) {
        console.log(`\n=== Testing ${endpoint} ===`);
        const results = [];
        
        for (let i = 1; i <= attempts; i++) {
            try {
                const startTime = Date.now();
                const response = await fetch(`${baseUrl}${endpoint}`);
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                
                const result = {
                    attempt: i,
                    status: response.status,
                    responseTime: responseTime,
                    success: response.ok,
                    contentType: response.headers.get('content-type'),
                    dataReceived: false,
                    errorMessage: null
                };
                
                if (response.ok) {
                    try {
                        const data = await response.json();
                        result.dataReceived = !!data;
                        result.dataSize = JSON.stringify(data).length;
                    } catch (e) {
                        result.errorMessage = 'Failed to parse JSON';
                    }
                } else {
                    result.errorMessage = `HTTP ${response.status}`;
                }
                
                results.push(result);
                console.log(`  Attempt ${i}: ${result.success ? '✅' : '❌'} ${result.status} (${result.responseTime}ms)${result.errorMessage ? ' - ' + result.errorMessage : ''}`);
                
                // Small delay between requests
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                results.push({
                    attempt: i,
                    status: 0,
                    responseTime: 0,
                    success: false,
                    contentType: null,
                    dataReceived: false,
                    errorMessage: error.message
                });
                console.log(`  Attempt ${i}: ❌ Network Error - ${error.message}`);
            }
        }
        
        // Analyze results
        const successCount = results.filter(r => r.success).length;
        const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
        const maxResponseTime = Math.max(...results.map(r => r.responseTime));
        const minResponseTime = Math.min(...results.map(r => r.responseTime));
        
        console.log(`\n📊 ${endpoint} Summary:`);
        console.log(`  Success Rate: ${successCount}/${attempts} (${(successCount/attempts*100).toFixed(1)}%)`);
        console.log(`  Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
        console.log(`  Response Time Range: ${minResponseTime}ms - ${maxResponseTime}ms`);
        
        if (successCount < attempts) {
            console.log(`  ⚠️  INCONSISTENT LOADING DETECTED!`);
        }
        
        return {
            endpoint,
            successRate: successCount / attempts,
            avgResponseTime,
            maxResponseTime,
            minResponseTime,
            results
        };
    }
    
    // Test each endpoint
    const allResults = [];
    for (const endpoint of testEndpoints) {
        const result = await testEndpointConsistency(endpoint);
        allResults.push(result);
    }
    
    // Overall analysis
    console.log('\n' + '='.repeat(60));
    console.log('📈 OVERALL DATA LOADING ANALYSIS');
    console.log('='.repeat(60));
    
    const problemEndpoints = allResults.filter(r => r.successRate < 1.0);
    const slowEndpoints = allResults.filter(r => r.avgResponseTime > 3000);
    const inconsistentEndpoints = allResults.filter(r => r.maxResponseTime - r.minResponseTime > 2000);
    
    if (problemEndpoints.length > 0) {
        console.log('\n❌ ENDPOINTS WITH LOADING FAILURES:');
        problemEndpoints.forEach(endpoint => {
            console.log(`  ${endpoint.endpoint}: ${(endpoint.successRate * 100).toFixed(1)}% success rate`);
        });
    }
    
    if (slowEndpoints.length > 0) {
        console.log('\n🐌 SLOW ENDPOINTS (>3s average):');
        slowEndpoints.forEach(endpoint => {
            console.log(`  ${endpoint.endpoint}: ${endpoint.avgResponseTime.toFixed(0)}ms average`);
        });
    }
    
    if (inconsistentEndpoints.length > 0) {
        console.log('\n⚡ INCONSISTENT RESPONSE TIMES (>2s variance):');
        inconsistentEndpoints.forEach(endpoint => {
            console.log(`  ${endpoint.endpoint}: ${endpoint.minResponseTime}ms - ${endpoint.maxResponseTime}ms range`);
        });
    }
    
    // Recommendations
    console.log('\n🔧 RECOMMENDATIONS:');
    if (problemEndpoints.length > 0) {
        console.log('  1. Check database connection pool settings');
        console.log('  2. Verify Prisma timeout configurations');
        console.log('  3. Review API route error handling');
    }
    if (slowEndpoints.length > 0) {
        console.log('  4. Optimize database queries with indexes');
        console.log('  5. Implement caching for slow endpoints');
        console.log('  6. Consider pagination for large datasets');
    }
    if (inconsistentEndpoints.length > 0) {
        console.log('  7. Check Vercel function cold starts');
        console.log('  8. Review database connection pooling');
        console.log('  9. Monitor Supabase connection limits');
    }
    
    if (problemEndpoints.length === 0 && slowEndpoints.length === 0 && inconsistentEndpoints.length === 0) {
        console.log('  ✅ All endpoints loading consistently!');
    }
}

testDataLoadingConsistency().catch(console.error);
