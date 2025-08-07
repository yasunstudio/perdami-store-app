// Test if login session is actually working
async function testSessionAfterLogin() {
    console.log('🔍 Testing Complete Login and Session Flow...\n');
    
    const baseUrl = 'https://dharma-wanita-perdami.vercel.app';
    
    // Step 1: Get CSRF Token
    console.log('1. Getting CSRF Token...');
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    const cookies = csrfResponse.headers.get('set-cookie');
    
    // Step 2: Login
    console.log('2. Logging in customer@example.com...');
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
            'Cookie': cookies || ''
        },
        body: loginData,
        redirect: 'manual'
    });
    
    console.log(`Login Status: ${loginResponse.status}`);
    
    if (loginResponse.status === 302) {
        const sessionCookie = loginResponse.headers.get('set-cookie');
        console.log('✅ Login successful');
        
        // Step 3: Test session with the new cookie
        console.log('\n3. Testing session with login cookie...');
        
        const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
            headers: {
                'Cookie': sessionCookie || ''
            }
        });
        
        if (sessionResponse.ok) {
            const session = await sessionResponse.json();
            console.log('✅ Session retrieved successfully:');
            console.log(JSON.stringify(session, null, 2));
            
            if (session && session.user) {
                console.log('\n🎉 LOGIN COMPLETELY WORKING!');
                console.log(`User: ${session.user.name} (${session.user.email})`);
                console.log(`Role: ${session.user.role}`);
            }
        } else {
            console.log('❌ Failed to get session');
        }
        
        // Step 4: Test admin login too
        console.log('\n4. Testing admin login...');
        
        const adminLoginData = new URLSearchParams({
            email: 'admin@example.com',
            password: 'Admin123',
            csrfToken: csrfData.csrfToken,
            callbackUrl: baseUrl + '/admin'
        });
        
        const adminLoginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookies || ''
            },
            body: adminLoginData,
            redirect: 'manual'
        });
        
        console.log(`Admin Login Status: ${adminLoginResponse.status}`);
        
        if (adminLoginResponse.status === 302) {
            const adminSessionCookie = adminLoginResponse.headers.get('set-cookie');
            
            const adminSessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
                headers: {
                    'Cookie': adminSessionCookie || ''
                }
            });
            
            if (adminSessionResponse.ok) {
                const adminSession = await adminSessionResponse.json();
                console.log('✅ Admin session retrieved successfully:');
                console.log(`Admin User: ${adminSession.user.name} (${adminSession.user.email})`);
                console.log(`Admin Role: ${adminSession.user.role}`);
            }
        }
        
    } else {
        console.log('❌ Login failed');
    }
}

testSessionAfterLogin().catch(console.error);
