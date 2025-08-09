// Buka browser console dan jalankan ini untuk test login
(async function testLogin() {
  console.log('🧪 Testing login...');
  
  try {
    // Get CSRF token first
    const csrfResponse = await fetch('/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    console.log('🔒 CSRF Token:', csrfData.csrfToken);
    
    // Test login with proper form data
    const formData = new FormData();
    formData.append('email', 'admin@perdami.com');
    formData.append('password', 'perdami123');
    formData.append('csrfToken', csrfData.csrfToken);
    formData.append('callbackUrl', '/admin');
    formData.append('json', 'true');
    
    const loginResponse = await fetch('/api/auth/callback/credentials', {
      method: 'POST',
      body: formData,
    });
    
    console.log('📝 Login Response Status:', loginResponse.status);
    console.log('📝 Login Response Headers:', Object.fromEntries(loginResponse.headers.entries()));
    
    const loginData = await loginResponse.text();
    console.log('📝 Login Response Body:', loginData);
    
    // Check session
    const sessionResponse = await fetch('/api/auth/session');
    const sessionData = await sessionResponse.json();
    console.log('👤 Session after login:', sessionData);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
})();
