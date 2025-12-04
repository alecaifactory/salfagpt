import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({ projectId: 'salfagpt' });

const EXPECTED = {
  'Asistente Legal Territorial RDI (M1-v2)': [
    'jriverof@iaconcagua.com',
    'afmanriquez@iaconcagua.com',
    'cquijadam@iaconcagua.com',
    'ireygadas@iaconcagua.com',
    'jmancilla@iaconcagua.com',
    'mallende@iaconcagua.com',
    'recontreras@iaconcagua.com',
    'dundurraga@iaconcagua.com',
    'rfuentesm@inoval.cl',
    'fdiazt@salfagestion.cl',
    'sorellanac@salfagestion.cl',
    'nfarias@salfagestion.cl',
    'alecdickinson@gmail.com',
    'alec@salfacloud.cl'
  ]
};

async function verify() {
  console.log('🔍 FINAL VERIFICATION: Asistente Legal Territorial RDI\n');
  console.log('='.repeat(80));
  
  const snap = await firestore.collection('conversations')
    .where('title', '==', 'Asistente Legal Territorial RDI (M1-v2)')
    .limit(1)
    .get();
  
  if (snap.empty) {
    console.log('❌ Agent not found!');
    process.exit(1);
  }
  
  const agent = snap.docs[0].data();
  const sharedEmails = (agent.sharedWith || []).map(s => s.email);
  
  console.log(`Agent: ${agent.title}`);
  console.log(`Created by: ${agent.userId}`);
  console.log(`Shared with: ${sharedEmails.length} users\n`);
  
  const expected = EXPECTED['Asistente Legal Territorial RDI (M1-v2)'];
  
  console.log('Checking each expected user:\n');
  
  let allMatch = true;
  expected.forEach((email, idx) => {
    const hasAccess = sharedEmails.includes(email);
    const status = hasAccess ? '✅' : '❌';
    console.log(`${idx + 1}. ${status} ${email}`);
    if (!hasAccess) allMatch = false;
  });
  
  console.log('\n' + '='.repeat(80));
  
  if (allMatch) {
    console.log('\n✅ SUCCESS: All 14 expected users have access!');
  } else {
    console.log('\n❌ INCOMPLETE: Some users missing access');
  }
  
  // Check for extra users
  const extraUsers = sharedEmails.filter(email => !expected.includes(email));
  if (extraUsers.length > 0) {
    console.log(`\n⚠️  Extra users with access: ${extraUsers.join(', ')}`);
  }
  
  console.log('');
  process.exit(allMatch ? 0 : 1);
}

verify();
