const bcrypt = require('bcryptjs');

async function testLoginAPI() {
  try {
    console.log('🧪 Testing login API...');
    
    const loginData = {
      email: 'customer@example.com',
      password: 'Customer123',
      redirect: false,
      csrfToken: 'test'
    };
    
    console.log('📝 Login data:', { email: loginData.email, password: '***' });
    
    // Test with local server (if running)
    const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(loginData).toString()
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response statusText:', response.statusText);
    
    if (response.ok) {
      const result = await response.text();
      console.log('✅ Response:', result);
    } else {
      console.log('❌ Error response:', await response.text());
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('💡 Tip: Pastikan local server berjalan dengan "npm run dev"');
  }
}

// Also test password hash directly
async function verifyPasswordHash() {
  console.log('\n🔑 Testing password hash...');
  
  const password = 'Customer123';
  const testHashes = [
    '$2a$12$example1', // example
    '$2b$12$example2', // example  
  ];
  
  // Create a new hash
  const newHash = await bcrypt.hash(password, 12);
  console.log('🆕 New hash created:', newHash.substring(0, 20) + '...');
  
  // Test comparison
  const isValid = await bcrypt.compare(password, newHash);
  console.log('✅ Password comparison result:', isValid ? 'VALID' : 'INVALID');
}

verifyPasswordHash();
testLoginAPI();
