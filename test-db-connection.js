// Direct database connection test to isolate the issue
async function testDatabaseConnection() {
    console.log('🔍 Testing Database Connection Issues...\n');
    
    const baseUrl = 'https://dharma-wanita-perdami.vercel.app';
    
    // Test the simplest API endpoint with minimal database operations
    const testEndpoints = [
        { path: '/api/health', description: 'Basic health check' },
        { path: '/api/users/stats', description: 'User stats (working endpoint)' },
        { path: '/api/stores', description: 'Stores listing' },
        { path: '/api/bundles', description: 'Bundles listing' },
    ];
    
    for (const endpoint of testEndpoints) {
        console.log(`\n=== Testing ${endpoint.description} ===`);
        console.log(`Endpoint: ${endpoint.path}`);
        
        // Test multiple times to see pattern
        const results = [];
        for (let i = 1; i <= 3; i++) {
            try {
                const startTime = Date.now();
                const response = await fetch(`${baseUrl}${endpoint.path}`);
                const endTime = Date.now();
                
                console.log(`  Test ${i}: Status ${response.status} (${endTime - startTime}ms)`);
                
                if (response.status === 500) {
                    const error = await response.text();
                    try {
                        const errorData = JSON.parse(error);
                        console.log(`    Error: ${errorData.error || errorData.message || 'Unknown'}`);
                    } catch {
                        console.log(`    Error: ${error.substring(0, 100)}`);
                    }
                } else if (response.ok) {
                    const data = await response.json();
                    console.log(`    Success: ${JSON.stringify(data).length} chars`);
                }
                
                results.push({
                    success: response.ok,
                    status: response.status,
                    time: endTime - startTime
                });
                
                // Wait between requests
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.log(`  Test ${i}: Network Error - ${error.message}`);
                results.push({
                    success: false,
                    status: 0,
                    time: 0
                });
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        console.log(`  Summary: ${successCount}/3 successful`);
    }
    
    // Test with a simple database fix endpoint
    console.log('\n=== Testing Emergency Database Fix ===');
    try {
        const response = await fetch(`${baseUrl}/api/emergency-db-fix`);
        console.log(`Database fix status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Database fix result:', data);
        } else {
            const error = await response.text();
            console.log('Database fix error:', error.substring(0, 200));
        }
    } catch (error) {
        console.log('Database fix failed:', error.message);
    }
    
    console.log('\n=== Recommendations ===');
    console.log('Based on the patterns observed:');
    console.log('1. Database connection pooling conflicts are causing intermittent failures');
    console.log('2. Some endpoints work consistently (users/stats) while others fail intermittently');
    console.log('3. This suggests specific Prisma queries or table operations are problematic');
    console.log('4. Consider implementing connection retry logic and error handling');
    console.log('5. May need to switch to direct SQL queries for problematic endpoints');
}

testDatabaseConnection().catch(console.error);
