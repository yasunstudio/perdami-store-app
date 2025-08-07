// Test both customer and admin login
async function testBothLogins() {
    console.log('👥 Testing Both Customer and Admin Logins...\n');
    
    const baseUrl = 'https://dharma-wanita-perdami.vercel.app';
    
    // Function to test a login
    async function testLogin(email, password, userType) {
        console.log(`\n=== Testing ${userType} Login (${email}) ===`);
        
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
                        console.log(`   Session expires: ${session.expires}`);
                        return true;
                    }
                }
            }
        }
        
        console.log(`❌ ${userType} Login FAILED`);
        return false;
    }
    
    // Test both accounts
    const customerSuccess = await testLogin('customer@example.com', 'Customer123', 'Customer');
    const adminSuccess = await testLogin('admin@example.com', 'Admin123', 'Admin');
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 LOGIN TEST SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Customer Login: ${customerSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Admin Login: ${adminSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (customerSuccess && adminSuccess) {
        console.log('\n🎉 BOTH LOGINS WORKING PERFECTLY!');
        console.log('🔗 Production site: https://dharma-wanita-perdami.vercel.app/');
        console.log('\n📋 Test credentials:');
        console.log('   Customer: customer@example.com / Customer123');
        console.log('   Admin: admin@example.com / Admin123');
    } else {
        console.log('\n⚠️  Some logins need attention');
    }
}

testBothLogins().catch(console.error);
