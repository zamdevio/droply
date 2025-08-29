// Performance test script for API endpoints
console.log('🚀 Testing API performance...');

async function testPerformance() {
  const endpoints = [
    '/api/v1/info/test123',
    '/api/v1/upload',
    '/api/v1/download/test123'
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📊 Testing: ${endpoint}`);
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`⏱️  Duration: ${duration}ms`);
      
      if (duration > 1000) {
        console.log(`⚠️  SLOW: ${duration}ms (should be under 1000ms)`);
      } else if (duration > 500) {
        console.log(`🟡 MEDIUM: ${duration}ms (should be under 500ms)`);
      } else {
        console.log(`🚀 FAST: ${duration}ms`);
      }
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`❌ Error: ${error.message}`);
      console.log(`⏱️  Duration: ${duration}ms`);
    }
  }
}

// Run performance test
testPerformance();
