const testAfterFix = async () => {
  try {
    console.log('🎯 Testing AFTER deployment - Dashboard API with FIXED isFeatured...\n');
    
    const response = await fetch('https://dharma-wanita-perdami.vercel.app/api/admin/dashboard');
    const data = await response.json();
    
    console.log('📊 AFTER FIX - Dashboard API Response:');
    console.log('Total Products in response:', data.popularProducts?.length || 0);
    
    if (data.popularProducts && data.popularProducts.length > 0) {
      console.log('\n🏆 Popular Products (Now with CORRECT isFeatured from Database):');
      
      let featuredCount = 0;
      data.popularProducts.forEach((product, index) => {
        const featuredBadge = product.isFeatured ? '⭐ FEATURED' : '   Not Featured';
        if (product.isFeatured) featuredCount++;
        
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   Featured: ${featuredBadge}`);
        console.log(`   Terjual: ${product.totalSold} unit`);
        console.log(`   Toko: ${product.storeName}`);
        console.log('');
      });
      
      console.log('📈 VERIFICATION RESULTS:');
      console.log(`✅ Featured products in dashboard: ${featuredCount}/5`);
      console.log(`✅ Expected from database: ALL should be featured (21/21 in DB have isFeatured: true)`);
      
      if (featuredCount === 5) {
        console.log('🎉 SUCCESS! Dashboard now correctly reflects database isFeatured status!');
      } else {
        console.log('⚠️  Still inconsistent - need to investigate further');
      }
      
    } else {
      console.log('❌ No popular products found');
    }
    
  } catch (error) {
    console.error('❌ Error testing dashboard API:', error);
  }
};

testAfterFix();
