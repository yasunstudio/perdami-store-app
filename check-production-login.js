const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function checkProductionUsers() {
  console.log('🌐 Mengecek users di production Vercel...');
  
  try {
    // Coba login sebagai admin dulu untuk mendapatkan session
    const adminLoginResponse = await fetch('https://perdami-store-gj58a91ea-yasunstudios-projects.vercel.app/api/auth/callback/credentials', {
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
    
    console.log('🔐 Admin login response status:', adminLoginResponse.status);
    
    if (adminLoginResponse.ok) {
      console.log('✅ Admin login berhasil');
      
      // Extract cookies dari response
      const cookies = adminLoginResponse.headers.get('set-cookie');
      console.log('🍪 Got cookies:', cookies ? 'Yes' : 'No');
      
      // Coba akses API admin users
      const usersResponse = await fetch('https://perdami-store-gj58a91ea-yasunstudios-projects.vercel.app/api/admin/users', {
        headers: {
          'Cookie': cookies || '',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('👥 Users API response status:', usersResponse.status);
      
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        console.log('📋 Users found:', users.users?.length || 0);
        
        const customerUser = users.users?.find(u => u.email === 'customer@example.com');
        if (customerUser) {
          console.log('✅ Customer user found in production:', {
            id: customerUser.id,
            email: customerUser.email,
            role: customerUser.role,
            verified: customerUser.emailVerified
          });
        } else {
          console.log('❌ Customer user NOT found in production');
          console.log('📋 Available users:');
          users.users?.forEach((u, i) => {
            console.log(`  ${i+1}. ${u.email} (${u.role})`);
          });
        }
      } else {
        console.log('❌ Failed to access users API:', await usersResponse.text());
      }
    } else {
      console.log('❌ Admin login failed:', await adminLoginResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test customer login directly
async function testCustomerLoginDirect() {
  console.log('\n🧪 Testing customer login directly...');
  
  try {
    const response = await fetch('https://perdami-store-gj58a91ea-yasunstudios-projects.vercel.app/api/auth/callback/credentials', {
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
    
    console.log('📡 Customer login response status:', response.status);
    console.log('📡 Customer login response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Response body (first 200 chars):', responseText.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ Customer login error:', error.message);
  }
}

checkProductionUsers();
testCustomerLoginDirect();
