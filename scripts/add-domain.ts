import { createDomain } from '../src/lib/domains.js';

async function main() {
  console.log('🔧 Creating getaifactory.com domain...');

  try {
    await createDomain('getaifactory.com', {
      name: 'GetAI Factory',
      createdBy: 'alec@getaifactory.com',
      enabled: true,
      description: 'GetAI Factory - AI Development Company',
      allowedAgents: [],
      allowedContextSources: []
    });

    console.log('✅ Domain created and enabled');
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('ℹ️ Domain already exists, ensuring it is enabled...');
      
      // If domain exists, just make sure it's enabled
      const { updateDomain } = await import('../src/lib/domains.js');
      await updateDomain('getaifactory.com', { enabled: true });
      console.log('✅ Domain enabled');
    } else {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  }
  
  process.exit(0);
}

main();

