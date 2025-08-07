const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testLoginOnCorrectDomain() {
  console.log('🌐 Testing login on: https://dharma-wanita-perdami.vercel.app/');
  
  // Test 1: Check if users exist in production database
  console.log('\n1️⃣ Testing database connection...');
  try {
    const healthResponse = await fetch('https://dharma-wanita-perdami.vercel.app/api/health');
    console.log('🏥 Health API status:', healthResponse.status);
    
    if (healthResponse.status === 200) {
      const health = await healthResponse.json();
      console.log('✅ Health response:', health);
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
  }

  // Test 2: Admin Login Test
  console.log('\n2️⃣ Testing ADMIN login...');
  try {
    const adminLoginResponse = await fetch('https://dharma-wanita-perdami.vercel.app/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'admin@perdami.com',
        password: 'admin123',
        redirect: 'false'
      }).toString()
    });
    
    console.log('👑 Admin login status:', adminLoginResponse.status);
    console.log('👑 Admin response headers:', Object.fromEntries(adminLoginResponse.headers.entries()));
    
    if (adminLoginResponse.status === 200) {
      console.log('✅ Admin login: SUCCESS');
      const adminText = await adminLoginResponse.text();
      console.log('📄 Admin response type:', adminText.includes('<!DOCTYPE') ? 'HTML (redirect)' : 'JSON');
    } else {
      console.log('❌ Admin login: FAILED');
      const errorText = await adminLoginResponse.text();
      console.log('📄 Admin error:', errorText.substring(0, 300));
    }
    
  } catch (error) {
    console.error('❌ Admin login error:', error.message);
  }

  // Test 3: Customer Login Test
  console.log('\n3️⃣ Testing CUSTOMER login...');
  try {
    const customerLoginResponse = await fetch('https://dharma-wanita-perdami.vercel.app/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'customer@example.com',
        password: 'Customer123',
        redirect: 'false'
      }).toString()
    });
    
    console.log('👤 Customer login status:', customerLoginResponse.status);
    console.log('👤 Customer response headers:', Object.fromEntries(customerLoginResponse.headers.entries()));
    
    if (customerLoginResponse.status === 200) {
      console.log('✅ Customer login: SUCCESS');
    } else {
      console.log('❌ Customer login: FAILED');
      const errorText = await customerLoginResponse.text();
      console.log('📄 Customer error:', errorText.substring(0, 300));
    }
    
  } catch (error) {
    console.error('❌ Customer login error:', error.message);
  }

  // Test 4: Check if we can register customer user
  console.log('\n4️⃣ Trying to register customer user...');
  try {
    const registerResponse = await fetch('https://dharma-wanita-perdami.vercel.app/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'customer@example.com',
        password: 'Customer123',
        name: 'Customer Test',
        confirmPassword: 'Customer123'
      })
    });
    
    console.log('📝 Register response status:', registerResponse.status);
    
    if (registerResponse.status === 201) {
      console.log('✅ Customer user created successfully');
    } else if (registerResponse.status === 400) {
      const errorResponse = await registerResponse.json();
      console.log('ℹ️ Register response:', errorResponse);
    } else {
      const errorText = await registerResponse.text();
      console.log('❌ Register failed:', errorText.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Register error:', error.message);
  }

  // Test 5: Check what happens with wrong credentials
  console.log('\n5️⃣ Testing with WRONG credentials...');
  try {
    const wrongLoginResponse = await fetch('https://dharma-wanita-perdami.vercel.app/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'admin@perdami.com',
        password: 'wrongpassword',
        redirect: 'false'
      }).toString()
    });
    
    console.log('❌ Wrong credentials status:', wrongLoginResponse.status);
    
    if (wrongLoginResponse.status === 401) {
      console.log('✅ Wrong credentials properly rejected (401)');
    } else {
      console.log('❓ Unexpected response for wrong credentials');
    }
    
  } catch (error) {
    console.error('❌ Wrong credentials test error:', error.message);
  }
}

testLoginOnCorrectDomain();
