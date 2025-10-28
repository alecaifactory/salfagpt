import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';

console.log('🔍 Testing Firestore connection...');
console.log('   Project:', PROJECT_ID);
console.log();

const firestore = new Firestore({
  projectId: PROJECT_ID
});

async function test() {
  try {
    console.log('📡 Attempting to list conversations...');
    
    const snapshot = await firestore.collection('conversations')
      .limit(5)
      .get();
    
    console.log(`✅ Success! Found ${snapshot.size} conversations`);
    
    snapshot.docs.forEach(doc => {
      console.log(`   - ${doc.data().title || 'Untitled'} (ID: ${doc.id})`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Possible causes:');
    console.error('   1. Firestore not enabled for project:', PROJECT_ID);
    console.error('   2. No permissions for this account');
    console.error('   3. Wrong project ID\n');
    console.error('🔧 Try:');
    console.error('   gcloud config set project salfagpt');
    console.error('   gcloud services enable firestore.googleapis.com');
    console.error('   gcloud auth application-default login\n');
    process.exit(1);
  }
}

test();

