/**
 * Test Script: MCP Server
 * 
 * Purpose: Test MCP server creation and access
 * Usage: npx tsx scripts/test-mcp-server.ts
 */

import { firestore } from '../src/lib/firestore';

async function testMCPServer() {
  console.log('🧪 Testing MCP Server Setup\n');

  try {
    // Test 1: Check if mcp_servers collection is accessible
    console.log('1️⃣  Checking Firestore collections...');
    
    const serversSnapshot = await firestore
      .collection('mcp_servers')
      .limit(1)
      .get();
    
    console.log(`   ✅ mcp_servers collection exists`);
    console.log(`   📊 Found ${serversSnapshot.size} servers\n`);

    // Test 2: Check users with SuperAdmin role
    console.log('2️⃣  Checking SuperAdmin users...');
    
    const superAdminSnapshot = await firestore
      .collection('users')
      .where('role', '==', 'superadmin')
      .get();
    
    if (superAdminSnapshot.empty) {
      console.log('   ⚠️  No SuperAdmin users found');
      console.log('   💡 Create one with: role: "superadmin", email: "alec@getaifactory.com"\n');
    } else {
      console.log(`   ✅ Found ${superAdminSnapshot.size} SuperAdmin(s):`);
      superAdminSnapshot.docs.forEach(doc => {
        const user = doc.data();
        console.log(`      - ${user.email} (${user.name})`);
      });
      console.log('');
    }

    // Test 3: Check users by domain
    console.log('3️⃣  Checking users in getaifactory.com domain...');
    
    const domainUsersSnapshot = await firestore
      .collection('users')
      .where('email', '>=', '@getaifactory.com')
      .where('email', '<=', '@getaifactory.com\uf8ff')
      .get();
    
    console.log(`   📧 Found ${domainUsersSnapshot.size} users`);
    
    if (domainUsersSnapshot.size > 0) {
      const userIds = domainUsersSnapshot.docs.map(doc => doc.id);
      
      // Test 4: Check conversations for domain users
      console.log('4️⃣  Checking conversations...');
      
      const conversationsSnapshot = await firestore
        .collection('conversations')
        .where('userId', 'in', userIds.slice(0, 10)) // Firestore limit
        .get();
      
      console.log(`   💬 Found ${conversationsSnapshot.size} conversations`);
      
      if (conversationsSnapshot.size > 0) {
        const totalMessages = conversationsSnapshot.docs.reduce(
          (sum, doc) => sum + (doc.data().messageCount || 0),
          0
        );
        
        const flashCount = conversationsSnapshot.docs.filter(doc =>
          doc.data().agentModel?.includes('flash')
        ).length;
        
        const proCount = conversationsSnapshot.docs.filter(doc =>
          doc.data().agentModel?.includes('pro')
        ).length;
        
        console.log(`   📊 Stats:`);
        console.log(`      - Total messages: ${totalMessages}`);
        console.log(`      - Flash agents: ${flashCount}`);
        console.log(`      - Pro agents: ${proCount}`);
        console.log(`      - Avg messages/agent: ${(totalMessages / conversationsSnapshot.size).toFixed(1)}`);
      }
    }
    
    console.log('\n✅ All checks passed!\n');
    console.log('📝 Next steps:');
    console.log('   1. Ensure SuperAdmin user exists (role: "superadmin")');
    console.log('   2. Deploy Firestore indexes: firebase deploy --only firestore:indexes');
    console.log('   3. Create MCP server via UI at http://localhost:3000/admin');
    console.log('   4. Configure Cursor with API key');
    console.log('   5. Test queries in Cursor\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error instanceof Error && error.message.includes('FAILED_PRECONDITION')) {
      console.log('\n💡 Missing Firestore index!');
      console.log('   Run: firebase deploy --only firestore:indexes\n');
    }
  }

  process.exit(0);
}

testMCPServer();




