const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAfterProtectionDisabled() {
  console.log('🧪 Testing after Vercel protection disabled...');
  
  // Test 1: Basic API health check
  console.log('\n1️⃣ Testing basic API access...');
  try {
    const healthResponse = await fetch('https://perdami-store-gj58a91ea-yasunstudios-projects.vercel.app/api/health');
    console.log('🏥 Health API status:', healthResponse.status);
    
    if (healthResponse.status === 200) {
      const health = await healthResponse.json();
      console.log('✅ Health response:', health);
    } else if (healthResponse.status === 401) {
      console.log('❌ Still protected - protection not disabled yet');
      return;
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
    return;
  }
  
  // Test 2: Customer login
  console.log('\n2️⃣ Testing customer login...');
  try {
    const loginResponse = await fetch('https://perdami-store-gj58a91ea-yasunstudios-projects.vercel.app/api/auth/callback/credentials', {
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
    
    console.log('🔐 Customer login status:', loginResponse.status);
    console.log('🍪 Response headers:', Object.fromEntries(loginResponse.headers.entries()));
    
    if (loginResponse.status === 200) {
      console.log('✅ Customer login SUCCESSFUL!');
      const loginResult = await loginResponse.json();
      console.log('📄 Login result:', loginResult);
    } else if (loginResponse.status === 401) {
      console.log('❌ Login failed - check credentials or user existence');
      const errorText = await loginResponse.text();
      console.log('📄 Error response:', errorText.substring(0, 300));
    } else {
      console.log(`❓ Unexpected status: ${loginResponse.status}`);
      const responseText = await loginResponse.text();
      console.log('📄 Response:', responseText.substring(0, 300));
    }
    
  } catch (error) {
    console.error('❌ Login test error:', error.message);
  }

  // Test 3: Admin login for comparison
  console.log('\n3️⃣ Testing admin login for comparison...');
  try {
    const adminResponse = await fetch('https://perdami-store-gj58a91ea-yasunstudios-projects.vercel.app/api/auth/callback/credentials', {
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
    
    console.log('👑 Admin login status:', adminResponse.status);
    
    if (adminResponse.status === 200) {
      console.log('✅ Admin login working');
    } else {
      console.log('❌ Admin login also failing');
    }
    
  } catch (error) {
    console.error('❌ Admin login test error:', error.message);
  }
}

// Also create customer user if not exists
async function createCustomerIfNotExists() {
  console.log('\n🏗️ Checking if we need to create customer user in production...');
  
  try {
    // Try to register customer if login fails
    const registerResponse = await fetch('https://perdami-store-gj58a91ea-yasunstudios-projects.vercel.app/api/auth/register', {
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
    
    if (registerResponse.status === 200 || registerResponse.status === 201) {
      console.log('✅ Customer user created successfully');
    } else if (registerResponse.status === 400) {
      console.log('ℹ️ User probably already exists');
    } else {
      const errorText = await registerResponse.text();
      console.log('❌ Register failed:', errorText.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Register error:', error.message);
  }
}

testAfterProtectionDisabled();
createCustomerIfNotExists();
