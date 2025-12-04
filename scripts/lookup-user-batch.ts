/**
 * Batch User Lookup - Get hash IDs and roles for multiple users
 * 
 * Usage: npx tsx scripts/lookup-user-batch.ts
 */

import { firestore } from '../src/lib/firestore';

const userEmails = [
  'svillegas@maqsa.cl',
  'csolis@maqsa.cl',
  'fmelin@maqsa.cl',
  'riprado@maqsa.cl',
  'jcalfin@maqsa.cl',
  'mmichael@maqsa.cl',
  'mfuenzalidar@novatec.cl',
  'phvaldivia@novatec.cl',
  'yzamora@inoval.cl',
  'jcancinoc@inoval.cl',
  'lurriola@novatec.cl',
  'fcerda@constructorasalfa.cl',
  'gfalvarez@novatec.cl',
  'dortega@novatec.cl',
  'mburgoa@novatec.cl',
  'abhernandez@maqsa.cl',
  'cvillalon@maqsa.cl',
  'hcontrerasp@salfamontajes.com',
  'iojedaa@maqsa.cl',
  'jefarias@maqsa.cl',
  'msgarcia@maqsa.cl',
  'ojrodriguez@maqsa.cl',
  'paovalle@maqsa.cl',
  'salegria@maqsa.cl',
  'vaaravena@maqsa.cl',
  'vclarke@maqsa.cl',
  'jriverof@iaconcagua.com',
  'afmanriquez@iaconcagua.com',
  'cquijadam@iaconcagua.com',
  'ireygadas@iaconcagua.com',
  'jmancilla@iaconcagua.com',
  'mallende@iaconcagua.com',
  'recontreras@iaconcagua.com',
  'dundurraga@iaconcagua.com',
  'rfuentesm@inoval.cl',
];

interface UserInfo {
  email: string;
  hashId: string;
  name: string;
  role: string;
  roles?: string[];
  company?: string;
  domain: string;
  googleUserId?: string;
  exists: boolean;
}

async function lookupUsers() {
  console.log('\n🔍 Looking up users in Firestore...\n');
  
  const results: UserInfo[] = [];
  const notFound: string[] = [];
  
  for (const email of userEmails) {
    try {
      const snapshot = await firestore
        .collection('users')
        .where('email', '==', email)
        .get();
      
      if (snapshot.empty) {
        notFound.push(email);
        results.push({
          email,
          hashId: 'NOT_FOUND',
          name: 'NOT_FOUND',
          role: 'NOT_FOUND',
          domain: email.split('@')[1],
          exists: false,
        });
      } else {
        const doc = snapshot.docs[0];
        const data = doc.data();
        
        results.push({
          email: data.email,
          hashId: doc.id,
          name: data.name || 'N/A',
          role: data.role || 'N/A',
          roles: data.roles || [],
          company: data.company || 'N/A',
          domain: email.split('@')[1],
          googleUserId: data.googleUserId || 'N/A',
          exists: true,
        });
      }
    } catch (error) {
      console.error(`❌ Error looking up ${email}:`, error);
      notFound.push(email);
      results.push({
        email,
        hashId: 'ERROR',
        name: 'ERROR',
        role: 'ERROR',
        domain: email.split('@')[1],
        exists: false,
      });
    }
  }
  
  // Print results in table format
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════');
  console.log('📊 USER LOOKUP RESULTS');
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════\n');
  
  console.log('| Email | Hash ID | Name | Role | Company | Domain | Google ID | Status |');
  console.log('|-------|---------|------|------|---------|--------|-----------|--------|');
  
  results.forEach(user => {
    const status = user.exists ? '✅ Found' : '❌ Not Found';
    const roles = user.roles && user.roles.length > 0 ? user.roles.join(', ') : user.role;
    console.log(
      `| ${user.email} | ${user.hashId} | ${user.name} | ${roles} | ${user.company || 'N/A'} | ${user.domain} | ${user.googleUserId || 'N/A'} | ${status} |`
    );
  });
  
  console.log('\n═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════\n');
  
  // Summary statistics
  const foundCount = results.filter(u => u.exists).length;
  const notFoundCount = results.filter(u => !u.exists).length;
  const expertCount = results.filter(u => u.exists && (u.role === 'expert' || u.roles?.includes('expert'))).length;
  const userCount = results.filter(u => u.exists && u.role === 'user' && !u.roles?.includes('expert')).length;
  
  console.log('📈 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════');
  console.log(`Total Users Queried: ${userEmails.length}`);
  console.log(`Found in Database: ${foundCount} (${((foundCount/userEmails.length)*100).toFixed(1)}%)`);
  console.log(`Not Found: ${notFoundCount}`);
  console.log(`Experts: ${expertCount}`);
  console.log(`Standard Users: ${userCount}`);
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════\n');
  
  // List not found users
  if (notFound.length > 0) {
    console.log('❌ USERS NOT FOUND IN DATABASE:');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════');
    notFound.forEach((email, i) => {
      console.log(`${i + 1}. ${email}`);
    });
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════\n');
    console.log('💡 These users need to be created in the system.');
    console.log('   They may need to log in once via OAuth to be registered.\n');
  }
  
  // Group by domain
  console.log('📊 USERS BY DOMAIN');
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════');
  const byDomain = results.reduce((acc, user) => {
    if (!acc[user.domain]) {
      acc[user.domain] = [];
    }
    acc[user.domain].push(user);
    return acc;
  }, {} as Record<string, UserInfo[]>);
  
  Object.entries(byDomain).forEach(([domain, users]) => {
    const found = users.filter(u => u.exists).length;
    console.log(`\n${domain}: ${found}/${users.length} found`);
    users.forEach(user => {
      const icon = user.exists ? '✅' : '❌';
      console.log(`  ${icon} ${user.email} - ${user.hashId}`);
    });
  });
  
  console.log('\n═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════\n');
  
  // Export for spreadsheet
  console.log('📋 CSV FORMAT (for spreadsheet)');
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════\n');
  console.log('Email,HashID,Name,Role,Company,Domain,GoogleID,Status');
  results.forEach(user => {
    const status = user.exists ? 'Found' : 'NotFound';
    const roles = user.roles && user.roles.length > 0 ? user.roles.join(';') : user.role;
    console.log(
      `${user.email},${user.hashId},${user.name},${roles},${user.company || 'N/A'},${user.domain},${user.googleUserId || 'N/A'},${status}`
    );
  });
  
  console.log('\n');
}

lookupUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });


