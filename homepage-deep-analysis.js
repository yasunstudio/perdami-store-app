const BASE_URL = 'https://dharma-wanita-perdami.vercel.app';

async function analyzeHomepageAPIs() {
  console.log('🔍 HOMEPAGE DEEP ANALYSIS');
  console.log('=========================');
  console.log('Analyzing ALL sections and data sources on homepage...\n');

  // First, let's fetch the homepage HTML to understand the structure
  console.log('📄 Step 1: Analyzing Homepage Structure...');
  
  try {
    const response = await fetch(BASE_URL);
    const html = await response.text();
    
    console.log(`   📏 Page Size: ${(html.length / 1024).toFixed(1)}KB`);
    console.log(`   🔧 Framework: ${html.includes('_next') ? 'Next.js' : 'Other'}`);
    
    // Look for data patterns that suggest API calls
    const dataPatterns = [
      { pattern: /featured.*bundle/gi, name: 'Featured Bundles Section' },
      { pattern: /store.*list/gi, name: 'Store Listing Section' },
      { pattern: /stats.*total/gi, name: 'Statistics Section' },
      { pattern: /hero.*banner/gi, name: 'Hero Banner Section' },
      { pattern: /testimonial/gi, name: 'Testimonials Section' },
      { pattern: /popular.*product/gi, name: 'Popular Products Section' }
    ];

    console.log('\n   🎨 Detected Page Sections:');
    dataPatterns.forEach(pattern => {
      const matches = html.match(pattern);
      if (matches) {
        console.log(`   ✅ ${pattern.name}: ${matches.length} references`);
      }
    });

  } catch (error) {
    console.log(`   ❌ Error analyzing homepage: ${error.message}`);
  }

  // Step 2: Test all potential APIs used by homepage
  console.log('\n📡 Step 2: Testing Homepage APIs...');
  
  const homepageAPIs = [
    {
      name: 'Featured Bundles',
      endpoint: '/api/bundles?featured=true&limit=6',
      section: 'Hero/Featured Products',
      critical: true,
      expectedData: 'bundles'
    },
    {
      name: 'All Bundles Preview',
      endpoint: '/api/bundles?limit=8',
      section: 'Products Showcase',
      critical: true,
      expectedData: 'bundles'
    },
    {
      name: 'Stores Listing',
      endpoint: '/api/stores',
      section: 'Store Directory',
      critical: true,
      expectedData: 'data'
    },
    {
      name: 'Store Statistics',
      endpoint: '/api/stores/stats',
      section: 'Stats Counter',
      critical: false,
      expectedData: 'totalStores'
    },
    {
      name: 'User Statistics',
      endpoint: '/api/users/stats',
      section: 'User Counter',
      critical: false,
      expectedData: 'totalUsers'
    },
    {
      name: 'Contact Information',
      endpoint: '/api/contact-info',
      section: 'Footer/Contact',
      critical: false,
      expectedData: 'contactInfo'
    },
    {
      name: 'Bank Accounts (for footer)',
      endpoint: '/api/banks',
      section: 'Payment Info',
      critical: false,
      expectedData: 'banks'
    }
  ];

  const NUM_TESTS = 10; // Test each API multiple times
  const allResults = [];

  for (const api of homepageAPIs) {
    console.log(`\n🧪 Testing ${api.name} (${api.section}):`);
    console.log(`   🔗 Endpoint: ${api.endpoint}`);
    console.log(`   ⚡ Critical: ${api.critical ? 'YES' : 'NO'}`);
    
    let successCount = 0;
    const responseTimes = [];
    const errors = [];
    const dataChecks = [];

    for (let i = 1; i <= NUM_TESTS; i++) {
      try {
        const start = Date.now();
        const response = await fetch(`${BASE_URL}${api.endpoint}`);
        const duration = Date.now() - start;

        if (response.ok) {
          const data = await response.json();
          
          // Check if expected data structure exists
          let hasValidData = false;
          let dataCount = 0;
          
          if (data[api.expectedData]) {
            hasValidData = true;
            if (Array.isArray(data[api.expectedData])) {
              dataCount = data[api.expectedData].length;
            } else {
              dataCount = 1;
            }
          } else if (data.bundles || data.data || data.status || data.totalUsers !== undefined || data.totalStores !== undefined) {
            hasValidData = true;
            if (data.bundles) dataCount = data.bundles.length;
            else if (data.data) dataCount = data.data.length;
            else dataCount = 1;
          }

          if (hasValidData) {
            successCount++;
            responseTimes.push(duration);
            dataChecks.push(dataCount);
            process.stdout.write('✅ ');
          } else {
            process.stdout.write('⚠️ ');
            errors.push(`Empty data (attempt ${i})`);
          }
        } else {
          process.stdout.write('❌ ');
          errors.push(`HTTP ${response.status} (attempt ${i})`);
        }
      } catch (error) {
        process.stdout.write('💥 ');
        errors.push(`Network error: ${error.message} (attempt ${i})`);
      }

      // Delay between requests to simulate real user behavior
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const successRate = (successCount / NUM_TESTS) * 100;
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
    const avgDataCount = dataChecks.length > 0 
      ? Math.round(dataChecks.reduce((a, b) => a + b, 0) / dataChecks.length)
      : 0;

    console.log(`\n   📊 Success Rate: ${successRate.toFixed(1)}% (${successCount}/${NUM_TESTS})`);
    console.log(`   ⏱️  Avg Response: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`   📦 Avg Data Count: ${avgDataCount} items`);
    
    if (errors.length > 0) {
      console.log(`   ⚠️  Sample Errors: ${errors.slice(0, 3).join(', ')}`);
    }

    // Status assessment
    let status, impact;
    if (successRate >= 95) {
      status = '🟢 EXCELLENT';
      impact = 'No user impact';
    } else if (successRate >= 85) {
      status = '🟡 GOOD';
      impact = 'Minor occasional issues';
    } else if (successRate >= 70) {
      status = '🟠 POOR';
      impact = 'Noticeable loading problems';
    } else {
      status = '🔴 CRITICAL';
      impact = 'Major user experience issues';
    }
    
    console.log(`   ${status} - ${impact}`);

    allResults.push({
      name: api.name,
      section: api.section,
      endpoint: api.endpoint,
      critical: api.critical,
      successRate,
      avgResponseTime: avgResponseTime.toFixed(0),
      avgDataCount,
      errors: errors.slice(0, 3),
      status,
      impact
    });
  }

  // Comprehensive Analysis
  console.log('\n\n📋 HOMEPAGE SECTIONS ANALYSIS');
  console.log('==============================');

  const criticalAPIs = allResults.filter(api => api.critical);
  const optionalAPIs = allResults.filter(api => !api.critical);

  console.log('\n🔥 CRITICAL SECTIONS (affect core user experience):');
  criticalAPIs.forEach(api => {
    const statusIcon = api.successRate >= 95 ? '🟢' : 
                       api.successRate >= 85 ? '🟡' : 
                       api.successRate >= 70 ? '🟠' : '🔴';
    console.log(`${statusIcon} ${api.section.padEnd(25)} ${api.successRate.toString().padStart(5)}% (${api.avgResponseTime}ms)`);
    console.log(`   └─ ${api.name} - ${api.impact}`);
  });

  console.log('\n📊 OPTIONAL SECTIONS (enhance user experience):');
  optionalAPIs.forEach(api => {
    const statusIcon = api.successRate >= 95 ? '🟢' : 
                       api.successRate >= 85 ? '🟡' : 
                       api.successRate >= 70 ? '🟠' : '🔴';
    console.log(`${statusIcon} ${api.section.padEnd(25)} ${api.successRate.toString().padStart(5)}% (${api.avgResponseTime}ms)`);
  });

  // Overall Assessment
  const criticalSuccess = criticalAPIs.reduce((sum, api) => sum + api.successRate, 0) / criticalAPIs.length;
  const overallSuccess = allResults.reduce((sum, api) => sum + api.successRate, 0) / allResults.length;

  console.log('\n🎯 HOMEPAGE PERFORMANCE SUMMARY');
  console.log('===============================');
  console.log(`🔥 Critical Sections Success: ${criticalSuccess.toFixed(1)}%`);
  console.log(`📊 Overall Success Rate: ${overallSuccess.toFixed(1)}%`);

  // User Experience Assessment
  let userExperience;
  if (criticalSuccess >= 95) {
    userExperience = '🎉 EXCELLENT - Users get consistent, smooth experience';
  } else if (criticalSuccess >= 85) {
    userExperience = '👍 GOOD - Most users have smooth experience with occasional hiccups';
  } else if (criticalSuccess >= 70) {
    userExperience = '⚠️  PROBLEMATIC - Users frequently encounter loading issues';
  } else {
    userExperience = '🚨 POOR - Users have frustrating experience with frequent failures';
  }

  console.log(`\n💫 User Experience: ${userExperience}`);

  // Problematic sections
  const problematicSections = allResults.filter(api => api.critical && api.successRate < 90);
  
  if (problematicSections.length > 0) {
    console.log('\n🚨 SECTIONS CAUSING USER FRUSTRATION:');
    problematicSections.forEach(api => {
      console.log(`❌ ${api.section} (${api.name}): ${api.successRate.toFixed(1)}% success`);
      console.log(`   Impact: ${api.impact}`);
      console.log(`   Errors: ${api.errors.join(', ')}`);
      console.log('');
    });
  } else {
    console.log('\n✅ No problematic critical sections found!');
  }

  // Recommendations
  console.log('\n💡 HOMEPAGE IMPROVEMENT RECOMMENDATIONS:');
  console.log('========================================');
  
  if (criticalSuccess >= 95) {
    console.log('🎯 Homepage is performing excellently!');
    console.log('🔄 Continue monitoring for any performance degradation');
    console.log('⚡ Consider optimizing response times for better user experience');
  } else {
    console.log('🔧 IMMEDIATE ACTIONS NEEDED:');
    
    problematicSections.forEach(api => {
      console.log(`\n📍 Fix ${api.section}:`);
      console.log(`   • Endpoint: ${api.endpoint}`);
      console.log(`   • Apply enhanced retry logic`);
      console.log(`   • Add fallback/loading states`);
      console.log(`   • Implement client-side error recovery`);
    });

    console.log('\n🎨 FRONTEND IMPROVEMENTS:');
    console.log('• Add skeleton loading for slow sections');
    console.log('• Implement progressive loading for non-critical data');
    console.log('• Add error boundaries with retry buttons');
    console.log('• Cache frequently accessed data');
  }

  return allResults;
}

analyzeHomepageAPIs()
  .then(() => {
    console.log('\n✨ Homepage analysis completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
