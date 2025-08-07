// Test admin login with correct email
async function testCorrectAdminLogin() {
    console.log('🔐 Testing Admin Login with Correct Email...\n');
    
    const baseUrl = 'https://dharma-wanita-perdami.vercel.app';
    
    // Function to test a login
    async function testLogin(email, password, userType) {
        console.log(`=== Testing ${userType} Login (${email}) ===`);
        
        // Get CSRF Token
        const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
        const csrfData = await csrfResponse.json();
        const initialCookies = csrfResponse.headers.get('set-cookie');
        
        // Login
        const loginData = new URLSearchParams({
            email: email,
            password: password,
            csrfToken: csrfData.csrfToken,
            callbackUrl: baseUrl + (userType === 'Admin' ? '/admin' : '/dashboard')
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
        
        console.log(`${userType} Login Status: ${loginResponse.status}`);
        
        if (loginResponse.status === 302) {
            const sessionCookies = loginResponse.headers.get('set-cookie');
            const sessionTokenMatch = sessionCookies?.match(/next-auth\.session-token=([^;]+)/);
            
            if (sessionTokenMatch) {
                const sessionToken = sessionTokenMatch[1];
                const cookieHeader = `next-auth.session-token=${sessionToken}`;
                
                // Get session
                const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
                    headers: { 'Cookie': cookieHeader }
                });
                
                if (sessionResponse.ok) {
                    const session = await sessionResponse.json();
                    if (session && session.user) {
                        console.log(`✅ ${userType} Login SUCCESSFUL!`);
                        console.log(`   Name: ${session.user.name}`);
                        console.log(`   Email: ${session.user.email}`);
                        console.log(`   Role: ${session.user.role}`);
                        console.log(`   ID: ${session.user.id}`);
                        return true;
                    }
                }
            }
        }
        
        console.log(`❌ ${userType} Login FAILED`);
        return false;
    }
    
    // Test possible admin passwords
    const adminEmail = 'admin@perdami.com';
    const possiblePasswords = ['Admin123', 'admin123', 'perdami123', 'Admin123!', 'password'];
    
    console.log(`Testing admin email: ${adminEmail}`);
    console.log(`Trying passwords: ${possiblePasswords.join(', ')}\n`);
    
    let adminSuccess = false;
    for (const password of possiblePasswords) {
        console.log(`\n--- Trying password: "${password}" ---`);
        adminSuccess = await testLogin(adminEmail, password, 'Admin');
        if (adminSuccess) {
            console.log(`🎉 ADMIN LOGIN SUCCESSFUL WITH PASSWORD: "${password}"`);
            break;
        }
    }
    
    // Also test customer to make sure it still works
    console.log('\n--- Verifying Customer Login Still Works ---');
    const customerSuccess = await testLogin('customer@example.com', 'Customer123', 'Customer');
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPLETE LOGIN TEST RESULTS:');
    console.log('='.repeat(60));
    console.log(`Customer Login (customer@example.com): ${customerSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Admin Login (admin@perdami.com): ${adminSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (customerSuccess && adminSuccess) {
        console.log('\n🎉 ALL LOGINS WORKING PERFECTLY!');
        console.log('🔗 Production site: https://dharma-wanita-perdami.vercel.app/');
    }
}

testCorrectAdminLogin().catch(console.error);
