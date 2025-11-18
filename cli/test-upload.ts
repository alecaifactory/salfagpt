/**
 * Test Upload Command
 * 
 * Quick test to verify upload command works
 * Run with: npx tsx cli/test-upload.ts
 */

import { uploadCommand } from './commands/upload';

async function test() {
  console.log('🧪 Testing CLI Upload Command\n');
  
  // Test configuration
  const config = {
    folderPath: '/Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118',
    tag: 'TEST-' + Date.now(),
    agentId: 'TestApiUpload_S001',
    userId: '114671162830729001607',
    userEmail: 'alec@getaifactory.com',
    model: 'gemini-2.5-flash' as const,
    testQuery: '¿Cuáles son los requisitos de seguridad?',
  };
  
  console.log('📋 Test Configuration:');
  console.log('   Folder:', config.folderPath);
  console.log('   Tag:', config.tag);
  console.log('   Agent:', config.agentId);
  console.log('   User:', config.userId);
  console.log('   Email:', config.userEmail);
  console.log('');
  
  try {
    const result = await uploadCommand(config);
    
    console.log('\n✅ Test completed!');
    console.log('   Files processed:', result.totalFiles);
    console.log('   Succeeded:', result.succeeded);
    console.log('   Failed:', result.failed);
    console.log('   Duration:', (result.totalDuration / 1000).toFixed(1), 's');
    console.log('   Cost:', '$' + result.totalCost.toFixed(4));
    
    if (result.failed > 0) {
      console.log('\n⚠️  Some files failed:');
      result.results
        .filter(r => !r.success)
        .forEach(r => console.log('   -', r.fileName, ':', r.error));
    }
    
    process.exit(result.failed === 0 ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

test();

