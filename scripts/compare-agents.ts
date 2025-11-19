import { firestore } from '../src/lib/firestore';

async function main() {
  const workingAgentId = 'AjtQZEIMQvFnPRJRjl4y'; // GESTION BODEGAS GPT (S001) - 76 docs
  const brokenAgentId = 'TestApiUpload_S001'; // Our CLI agent - 18 docs but shows 0
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║           AGENT COMPARISON - Working vs Broken              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  // Get both agents
  const workingDoc = await firestore.collection('conversations').doc(workingAgentId).get();
  const brokenDoc = await firestore.collection('conversations').doc(brokenAgentId).get();
  
  if (!workingDoc.exists || !brokenDoc.exists) {
    console.log('❌ One or both agents not found');
    return;
  }
  
  const workingData = workingDoc.data();
  const brokenData = brokenDoc.data();
  
  console.log('🟢 WORKING AGENT: GESTION BODEGAS GPT (S001)');
  console.log('═'.repeat(60));
  console.log('Agent ID:', workingAgentId);
  console.log('Agent Name:', workingData?.agentName || 'N/A');
  console.log('User ID:', workingData?.userId);
  console.log('Type:', workingData?.type);
  console.log('Active Context Count:', workingData?.activeContextSourceIds?.length || 0);
  console.log('Is Agent:', workingData?.isAgent);
  console.log('Created At:', workingData?.createdAt?.toDate?.() || 'N/A');
  console.log('\nFull structure keys:', Object.keys(workingData || {}).sort().join(', '));
  
  console.log('\n🔴 BROKEN AGENT: TestApiUpload_S001');
  console.log('═'.repeat(60));
  console.log('Agent ID:', brokenAgentId);
  console.log('Agent Name:', brokenData?.agentName || 'N/A');
  console.log('User ID:', brokenData?.userId);
  console.log('Type:', brokenData?.type);
  console.log('Active Context Count:', brokenData?.activeContextSourceIds?.length || 0);
  console.log('Is Agent:', brokenData?.isAgent);
  console.log('Created At:', brokenData?.createdAt?.toDate?.() || 'N/A');
  console.log('\nFull structure keys:', Object.keys(brokenData || {}).sort().join(', '));
  
  console.log('\n📊 KEY DIFFERENCES');
  console.log('═'.repeat(60));
  
  const workingKeys = new Set(Object.keys(workingData || {}));
  const brokenKeys = new Set(Object.keys(brokenData || {}));
  
  // Keys in working but not in broken
  const missingInBroken = [...workingKeys].filter(k => !brokenKeys.has(k));
  if (missingInBroken.length > 0) {
    console.log('\n❌ Missing in broken agent:');
    missingInBroken.forEach(key => {
      console.log(`   - ${key}: ${JSON.stringify(workingData?.[key])}`);
    });
  }
  
  // Keys in broken but not in working
  const extraInBroken = [...brokenKeys].filter(k => !workingKeys.has(k));
  if (extraInBroken.length > 0) {
    console.log('\n➕ Extra in broken agent:');
    extraInBroken.forEach(key => {
      console.log(`   - ${key}: ${JSON.stringify(brokenData?.[key])}`);
    });
  }
  
  // Compare specific important fields
  console.log('\n🔍 FIELD-BY-FIELD COMPARISON');
  console.log('═'.repeat(60));
  
  const importantFields = [
    'type', 'isAgent', 'agentName', 'userId', 
    'activeContextSourceIds', 'createdAt', 'updatedAt',
    'agentPrompt', 'description', 'systemInstructions'
  ];
  
  importantFields.forEach(field => {
    const workingValue = workingData?.[field];
    const brokenValue = brokenData?.[field];
    const same = JSON.stringify(workingValue) === JSON.stringify(brokenValue);
    const icon = same ? '✅' : '❌';
    
    console.log(`\n${icon} ${field}:`);
    console.log(`   Working: ${JSON.stringify(workingValue)?.substring(0, 100) || 'undefined'}`);
    console.log(`   Broken:  ${JSON.stringify(brokenValue)?.substring(0, 100) || 'undefined'}`);
  });
  
  console.log('\n\n💡 RECOMMENDATION');
  console.log('═'.repeat(60));
  
  if (missingInBroken.length > 0) {
    console.log('The broken agent is missing these critical fields:');
    missingInBroken.forEach(field => {
      console.log(`   - ${field}`);
    });
    console.log('\n🔧 We should add these fields to make it work like the other agents.');
  }
  
  // Check if agentName is missing
  if (!brokenData?.agentName || brokenData?.agentName === 'N/A') {
    console.log('\n⚠️  CRITICAL: agentName is missing or invalid!');
    console.log('   This is likely why the agent doesn\'t show up properly in the UI.');
  }
  
  // Check type field
  if (workingData?.type !== brokenData?.type) {
    console.log('\n⚠️  Type mismatch detected!');
    console.log(`   Working agent type: "${workingData?.type}"`);
    console.log(`   Broken agent type: "${brokenData?.type}"`);
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

