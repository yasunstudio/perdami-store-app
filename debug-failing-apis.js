// Debug specific API endpoints that are failing
async function debugFailingEndpoints() {
    console.log('🔍 Debugging Failing API Endpoints...\n');
    
    const baseUrl = 'https://dharma-wanita-perdami.vercel.app';
    
    // Test each failing endpoint and get detailed error info
    const endpoints = [
        '/api/bundles',
        '/api/stores', 
        '/api/admin/banks'
    ];
    
    for (const endpoint of endpoints) {
        console.log(`\n=== Debugging ${endpoint} ===`);
        
        try {
            const response = await fetch(`${baseUrl}${endpoint}`);
            console.log(`Status: ${response.status}`);
            console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
            
            const responseText = await response.text();
            console.log(`Response body (first 500 chars):`);
            console.log(responseText.substring(0, 500));
            
            if (response.headers.get('content-type')?.includes('json')) {
                try {
                    const data = JSON.parse(responseText);
                    console.log(`Parsed JSON error:`, data);
                } catch (e) {
                    console.log(`Failed to parse as JSON`);
                }
            }
            
        } catch (error) {
            console.log(`Network error: ${error.message}`);
        }
    }
    
    // Test with authenticated session (simulate admin login)
    console.log('\n=== Testing with Authentication ===');
    
    // Get CSRF token first
    try {
        const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
        const csrfData = await csrfResponse.json();
        const initialCookies = csrfResponse.headers.get('set-cookie');
        
        // Login as admin
        const loginData = new URLSearchParams({
            email: 'admin@perdami.com',
            password: 'admin123',
            csrfToken: csrfData.csrfToken
        });
        
        const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': initialCookies || ''
            },
            body: loginData,
            redirect: 'manual'
        });
        
        if (loginResponse.status === 302) {
            const sessionCookies = loginResponse.headers.get('set-cookie');
            
            console.log('✅ Login successful, testing admin endpoints...');
            
            // Test admin endpoints with authentication
            const adminEndpoints = ['/api/admin/dashboard', '/api/admin/banks', '/api/admin/orders'];
            
            for (const endpoint of adminEndpoints) {
                try {
                    const response = await fetch(`${baseUrl}${endpoint}`, {
                        headers: {
                            'Cookie': sessionCookies || ''
                        }
                    });
                    
                    console.log(`${endpoint}: ${response.status}`);
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.log(`  Error: ${errorText.substring(0, 200)}`);
                    } else {
                        console.log(`  ✅ Success`);
                    }
                } catch (error) {
                    console.log(`${endpoint}: Network error - ${error.message}`);
                }
            }
        } else {
            console.log('❌ Login failed');
        }
        
    } catch (error) {
        console.log('❌ Authentication test failed:', error.message);
    }
}

debugFailingEndpoints().catch(console.error);
