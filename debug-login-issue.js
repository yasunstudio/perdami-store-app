const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugLoginIssue() {
  console.log('🔍 Debugging login issue on dharma-wanita-perdami.vercel.app');
  
  // Test 1: Check NextAuth configuration endpoint
  console.log('\n1️⃣ Checking NextAuth configuration...');
  try {
    const authConfigResponse = await fetch('https://dharma-wanita-perdami.vercel.app/api/auth/providers');
    console.log('⚙️ Auth providers status:', authConfigResponse.status);
    
    if (authConfigResponse.status === 200) {
      const providers = await authConfigResponse.json();
      console.log('✅ Auth providers:', Object.keys(providers));
      console.log('🔑 Credentials provider:', providers.credentials ? 'Available' : 'NOT FOUND');
    }
  } catch (error) {
    console.error('❌ Auth config error:', error.message);
  }

  // Test 2: Check NextAuth session endpoint
  console.log('\n2️⃣ Checking NextAuth session...');
  try {
    const sessionResponse = await fetch('https://dharma-wanita-perdami.vercel.app/api/auth/session');
    console.log('👤 Session status:', sessionResponse.status);
    
    if (sessionResponse.status === 200) {
      const session = await sessionResponse.json();
      console.log('🔐 Current session:', session);
    }
  } catch (error) {
    console.error('❌ Session check error:', error.message);
  }

  // Test 3: Test with proper NextAuth signin endpoint
  console.log('\n3️⃣ Testing proper NextAuth signin endpoint...');
  try {
    const signinResponse = await fetch('https://dharma-wanita-perdami.vercel.app/api/auth/signin/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@perdami.com',
        password: 'admin123',
        callbackUrl: '/'
      })
    });
    
    console.log('🔐 Signin endpoint status:', signinResponse.status);
    console.log('🔐 Signin response headers:', Object.fromEntries(signinResponse.headers.entries()));
    
    const signinText = await signinResponse.text();
    console.log('📄 Signin response type:', signinText.includes('<!DOCTYPE') ? 'HTML' : 'Other');
    
  } catch (error) {
    console.error('❌ Signin endpoint error:', error.message);
  }

  // Test 4: Check database users directly via a potential debug endpoint
  console.log('\n4️⃣ Checking if users exist in production database...');
  try {
    // Try to create a user first to make sure customer exists
    const createUserResponse = await fetch('https://dharma-wanita-perdami.vercel.app/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test-customer@example.com',
        password: 'TestPass123',
        name: 'Test Customer',
        confirmPassword: 'TestPass123'
      })
    });
    
    console.log('👥 Create user status:', createUserResponse.status);
    
    if (createUserResponse.status === 201) {
      console.log('✅ Successfully created test user');
      
      // Now try to login with new user
      const testLoginResponse = await fetch('https://dharma-wanita-perdami.vercel.app/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: 'test-customer@example.com',
          password: 'TestPass123',
          redirect: 'false'
        }).toString()
      });
      
      console.log('🔐 New user login status:', testLoginResponse.status);
      
    } else {
      const createError = await createUserResponse.text();
      console.log('❌ Create user failed:', createError);
    }
    
  } catch (error) {
    console.error('❌ User creation error:', error.message);
  }
}

debugLoginIssue();
