// Test specific login flow
async function testLoginFlow() {
    console.log('🔧 Testing Login Flow Step by Step...\n');
    
    const baseUrl = 'https://dharma-wanita-perdami.vercel.app';
    
    // Step 1: Get CSRF Token
    console.log('1. Getting CSRF Token...');
    try {
        const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
        if (csrfResponse.ok) {
            const csrfData = await csrfResponse.json();
            console.log('✅ CSRF Token obtained:', csrfData.csrfToken.substring(0, 20) + '...');
            
            // Step 2: Test login with proper CSRF token
            console.log('\n2. Testing login with CSRF token...');
            
            const loginData = new URLSearchParams({
                email: 'customer@example.com',
                password: 'Customer123',
                csrfToken: csrfData.csrfToken,
                callbackUrl: baseUrl + '/dashboard'
            });
            
            const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': csrfResponse.headers.get('set-cookie') || ''
                },
                body: loginData,
                redirect: 'manual'
            });
            
            console.log(`Login Status: ${loginResponse.status}`);
            console.log(`Redirect Location: ${loginResponse.headers.get('location')}`);
            console.log(`Content-Type: ${loginResponse.headers.get('content-type')}`);
            console.log(`Set-Cookie: ${loginResponse.headers.get('set-cookie')}`);
            
            const responseText = await loginResponse.text();
            
            if (loginResponse.status === 302 || loginResponse.status === 301) {
                console.log('✅ Login successful - got redirect');
                console.log(`Redirect to: ${loginResponse.headers.get('location')}`);
            } else if (loginResponse.status === 200 && responseText.includes('<!DOCTYPE html>')) {
                console.log('❌ Login failed - returned to login page');
                // Check if there's an error in the URL or page
                if (responseText.includes('error') || responseText.includes('Error')) {
                    console.log('Found error indicators in response');
                }
            } else {
                console.log(`Response preview: ${responseText.substring(0, 500)}`);
            }
            
            // Step 3: Test direct signin endpoint
            console.log('\n3. Testing direct signin endpoint...');
            const signinResponse = await fetch(`${baseUrl}/api/auth/signin/credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: 'customer@example.com',
                    password: 'Customer123',
                    redirect: false
                })
            });
            
            console.log(`Direct signin status: ${signinResponse.status}`);
            const signinResult = await signinResponse.text();
            console.log(`Direct signin response: ${signinResult.substring(0, 300)}`);
            
        } else {
            console.log('❌ Failed to get CSRF token');
        }
    } catch (error) {
        console.error('❌ Error in login flow test:', error.message);
    }
    
    // Step 4: Test providers configuration
    console.log('\n4. Checking providers configuration...');
    try {
        const providersResponse = await fetch(`${baseUrl}/api/auth/providers`);
        if (providersResponse.ok) {
            const providers = await providersResponse.json();
            console.log('Available providers:', JSON.stringify(providers, null, 2));
        }
    } catch (error) {
        console.error('Error getting providers:', error.message);
    }
}

testLoginFlow().catch(console.error);
