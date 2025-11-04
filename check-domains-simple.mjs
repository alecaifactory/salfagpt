import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfacorp',
});

async function checkDomains() {
  console.log('🔍 Checking domains in Firestore...\n');
  
  const domainsToCheck = ['getaifactory.com', 'salfacloud.cl'];
  
  for (const domain of domainsToCheck) {
    try {
      const doc = await firestore.collection('domains').doc(domain).get();
      
      if (doc.exists) {
        const data = doc.data();
        console.log(`✅ ${domain}:`);
        console.log(`   Enabled: ${data.enabled ? 'YES ✅' : 'NO ❌'}`);
        console.log(`   Created: ${data.createdAt?.toDate?.()}`);
        console.log(`   Users: ${data.userCount || 0}`);
      } else {
        console.log(`❌ ${domain}: NOT FOUND`);
      }
      console.log('');
    } catch (error) {
      console.error(`Error checking ${domain}:`, error.message);
    }
  }
  
  // List ALL domains
  console.log('📋 All domains in Firestore:');
  const snapshot = await firestore.collection('domains').get();
  console.log(`Total: ${snapshot.size}\n`);
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`   ${doc.id}: ${data.enabled ? '✅ enabled' : '❌ disabled'} (${data.userCount || 0} users)`);
  });
  
  process.exit(0);
}

checkDomains();
