// Test cookie extraction and session persistence
async function testCookieSession() {
    console.log('🍪 Testing Cookie Session Management...\n');
    
    const baseUrl = 'https://dharma-wanita-perdami.vercel.app';
    
    // Step 1: Get CSRF Token and initial cookies
    console.log('1. Getting CSRF Token...');
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    const initialCookies = csrfResponse.headers.get('set-cookie');
    console.log('Initial cookies:', initialCookies);
    
    // Step 2: Login and get session cookie
    console.log('\n2. Logging in...');
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
            'Cookie': initialCookies || ''
        },
        body: loginData,
        redirect: 'manual'
    });
    
    console.log(`Login Status: ${loginResponse.status}`);
    const sessionCookies = loginResponse.headers.get('set-cookie');
    console.log('Session cookies received:');
    console.log(sessionCookies);
    
    if (loginResponse.status === 302 && sessionCookies) {
        // Extract just the session token
        const sessionTokenMatch = sessionCookies.match(/next-auth\.session-token=([^;]+)/);
        const callbackUrlMatch = sessionCookies.match(/__Secure-authjs\.callback-url=([^;]+)/);
        
        if (sessionTokenMatch) {
            const sessionToken = sessionTokenMatch[1];
            const cookieHeader = `next-auth.session-token=${sessionToken}`;
            
            console.log('\n3. Testing session with extracted token...');
            console.log('Using cookie:', cookieHeader.substring(0, 50) + '...');
            
            const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
                headers: {
                    'Cookie': cookieHeader
                }
            });
            
            console.log(`Session response status: ${sessionResponse.status}`);
            console.log(`Session response headers:`, Object.fromEntries(sessionResponse.headers.entries()));
            
            if (sessionResponse.ok) {
                const session = await sessionResponse.json();
                console.log('Session data:', JSON.stringify(session, null, 2));
                
                if (session && session.user) {
                    console.log('\n🎉 SESSION WORKING!');
                    console.log(`✅ User: ${session.user.name} (${session.user.email})`);
                    console.log(`✅ Role: ${session.user.role}`);
                } else {
                    console.log('❌ Session is null or empty');
                }
            } else {
                const errorText = await sessionResponse.text();
                console.log('Session error:', errorText.substring(0, 200));
            }
            
            // Test accessing a protected page
            console.log('\n4. Testing protected page access...');
            const dashboardResponse = await fetch(`${baseUrl}/dashboard`, {
                headers: {
                    'Cookie': cookieHeader
                },
                redirect: 'manual'
            });
            
            console.log(`Dashboard access status: ${dashboardResponse.status}`);
            if (dashboardResponse.status === 200) {
                console.log('✅ Protected page accessible');
            } else if (dashboardResponse.status === 302) {
                console.log(`Dashboard redirects to: ${dashboardResponse.headers.get('location')}`);
            }
            
        } else {
            console.log('❌ Could not extract session token from cookies');
        }
    } else {
        console.log('❌ Login failed or no cookies received');
    }
}

testCookieSession().catch(console.error);
