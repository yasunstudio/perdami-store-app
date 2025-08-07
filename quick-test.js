const BASE_URL = 'https://dharma-wanita-perdami.vercel.app';

async function quickTest() {
  console.log('🔍 Quick API Test');
  console.log('================');
  
  const endpoints = [
    { name: 'Stores', url: '/api/stores' },
    { name: 'Bundles', url: '/api/bundles?limit=3' },
    { name: 'Health', url: '/api/health' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing ${endpoint.name}...`);
      const start = Date.now();
      
      const response = await fetch(`${BASE_URL}${endpoint.url}`);
      const duration = Date.now() - start;
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ SUCCESS (${duration}ms)`);
        
        if (data?.bundles) {
          console.log(`   📦 Bundles: ${data.bundles.length}`);
        } else if (data?.data) {
          console.log(`   🏪 Stores: ${data.data.length}`);
        } else if (data?.status) {
          console.log(`   💚 Status: ${data.status}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log(`❌ FAILED (${response.status}): ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  }
}

quickTest()
  .then(() => {
    console.log('\n✨ Quick test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
