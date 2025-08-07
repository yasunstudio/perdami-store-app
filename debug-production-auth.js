const { PrismaClient } = require('@prisma/client');

// Test database connection and NextAuth functionality
async function testProductionAuth() {
    console.log('🔍 Testing Production Authentication...\n');
    
    // Test 1: Database Connection
    console.log('1. Testing Database Connection...');
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL
            }
        }
    });
    
    try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connection successful');
        
        // Check if users exist
        const users = await prisma.user.findMany({
            where: {
                email: {
                    in: ['customer@example.com', 'admin@example.com']
                }
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                password: {
                    select: {
                        id: true
                    }
                }
            }
        });
        
        console.log('✅ Found users:', users.length);
        users.forEach(user => {
            console.log(`   - ${user.email} (${user.role}) - Password: ${user.password ? 'Yes' : 'No'}`);
        });
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
    
    // Test 2: NextAuth API Endpoints
    console.log('\n2. Testing NextAuth API Endpoints...');
    
    const baseUrl = 'https://dharma-wanita-perdami.vercel.app';
    
    try {
        // Test providers endpoint
        const providersResponse = await fetch(`${baseUrl}/api/auth/providers`);
        console.log(`Providers endpoint status: ${providersResponse.status}`);
        
        if (providersResponse.ok) {
            const providers = await providersResponse.json();
            console.log('✅ Available providers:', Object.keys(providers));
        } else {
            const errorText = await providersResponse.text();
            console.log('❌ Providers error:', errorText.substring(0, 200));
        }
        
        // Test session endpoint
        const sessionResponse = await fetch(`${baseUrl}/api/auth/session`);
        console.log(`Session endpoint status: ${sessionResponse.status}`);
        
        if (sessionResponse.ok) {
            const session = await sessionResponse.json();
            console.log('✅ Session endpoint working, current session:', session);
        } else {
            const errorText = await sessionResponse.text();
            console.log('❌ Session error:', errorText.substring(0, 200));
        }
        
        // Test signin page
        const signinResponse = await fetch(`${baseUrl}/api/auth/signin`);
        console.log(`Signin page status: ${signinResponse.status}`);
        console.log(`Content-Type: ${signinResponse.headers.get('content-type')}`);
        
    } catch (error) {
        console.error('❌ API endpoint test failed:', error.message);
    }
    
    // Test 3: Manual Login Test
    console.log('\n3. Testing Manual Login...');
    
    try {
        // Test customer login
        const loginData = {
            email: 'customer@example.com',
            password: 'Customer123',
            redirect: false,
            csrfToken: 'test-token'
        };
        
        const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(loginData)
        });
        
        console.log(`Login attempt status: ${loginResponse.status}`);
        console.log(`Response headers:`, Object.fromEntries(loginResponse.headers.entries()));
        
        const responseText = await loginResponse.text();
        console.log(`Response type: ${loginResponse.headers.get('content-type')}`);
        console.log(`Response preview: ${responseText.substring(0, 300)}...`);
        
        if (responseText.includes('<!DOCTYPE html>')) {
            console.log('❌ Receiving HTML instead of JSON/redirect - NextAuth configuration issue');
        } else {
            console.log('✅ Response appears to be correct format');
        }
        
    } catch (error) {
        console.error('❌ Manual login test failed:', error.message);
    }
    
    console.log('\n🔚 Production authentication test completed');
}

// Run the test
testProductionAuth().catch(console.error);
