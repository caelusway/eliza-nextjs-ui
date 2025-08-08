const { etherscanService } = require('../src/services/etherscan-service');

async function testEtherscanIntegration() {
  console.log('🧪 Testing Etherscan API Integration...\n');
  
  const TOKEN_ADDRESS = '0x226a2fa2556c48245e57cd1cba4c6c9e67077dd2';
  
  try {
    // Test 1: API Connection
    console.log('1. Testing API connection...');
    const connectionTest = await etherscanService.testConnection();
    console.log(`   ✅ Connection test: ${connectionTest ? 'SUCCESS' : 'FAILED'}\n`);
    
    // Test 2: Token Info
    console.log('2. Fetching token info...');
    const tokenInfo = await etherscanService.getTokenInfo(TOKEN_ADDRESS);
    console.log('   ✅ Token Info:');
    console.log(`      Name: ${tokenInfo.tokenName}`);
    console.log(`      Symbol: ${tokenInfo.symbol}`);
    console.log(`      Decimals: ${tokenInfo.decimals}`);
    console.log(`      Total Supply: ${tokenInfo.totalSupply}`);
    console.log(`      Holders: ${tokenInfo.holders}\n`);
    
    // Test 3: Token Stats
    console.log('3. Fetching token stats...');
    const tokenStats = await etherscanService.getTokenStats(TOKEN_ADDRESS);
    console.log('   ✅ Token Stats:');
    console.log(`      Volume 24h: ${tokenStats.volume24h}`);
    console.log(`      Market Cap: ${tokenStats.marketCap}`);
    console.log(`      Price: ${tokenStats.price}`);
    console.log(`      Holders: ${tokenStats.holders}`);
    console.log(`      Total Supply: ${tokenStats.totalSupply}\n`);
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testEtherscanIntegration();