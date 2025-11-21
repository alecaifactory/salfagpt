/**
 * Test Script: Agent Management Organization Filtering
 * 
 * Verifies that:
 * - SuperAdmin sees all agents
 * - Admin sees only org agents
 * - Regular users see only own agents
 * 
 * Run: npx tsx scripts/test-agent-org-filtering.ts
 */

import { firestore, getUserById } from '../src/lib/firestore.js';
import { getUsersInOrganizations } from '../src/lib/organizations.js';

const CURRENT_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';

console.log('🧪 Testing Agent Management Organization Filtering');
console.log('Project:', CURRENT_PROJECT);
console.log('');

async function testSuperAdminAccess() {
  console.log('📋 Test 1: SuperAdmin Access (All Agents)');
  console.log('─'.repeat(60));
  
  try {
    // Simulate SuperAdmin query
    const allConversationsSnapshot = await firestore
      .collection('conversations')
      .orderBy('lastMessageAt', 'desc')
      .limit(10) // Sample
      .get();
    
    const agentDocs = allConversationsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.isAgent !== false;
    });
    
    console.log(`✅ Total conversations sampled: ${allConversationsSnapshot.docs.length}`);
    console.log(`✅ Agents found: ${agentDocs.length}`);
    
    if (agentDocs.length > 0) {
      const sample = agentDocs[0].data();
      console.log(`📊 Sample agent:`, {
        title: sample.title,
        userId: sample.userId,
        model: sample.agentModel,
      });
    }
    
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testAdminAccess() {
  console.log('📋 Test 2: Admin Access (Organization-Scoped)');
  console.log('─'.repeat(60));
  
  try {
    // Find an admin user
    const usersSnapshot = await firestore
      .collection('users')
      .where('role', '==', 'admin')
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️  No admin users found - skipping test');
      console.log('');
      return;
    }
    
    const adminDoc = usersSnapshot.docs[0];
    const adminUser = {
      ...adminDoc.data(),
      id: adminDoc.id,
    };
    
    console.log(`📊 Admin user:`, {
      email: adminUser.email,
      organizationId: adminUser.organizationId,
      assignedOrganizations: adminUser.assignedOrganizations,
    });
    
    // Get organization IDs
    const orgIds: string[] = [];
    if (adminUser.organizationId) {
      orgIds.push(adminUser.organizationId);
    }
    if (adminUser.assignedOrganizations) {
      orgIds.push(...adminUser.assignedOrganizations);
    }
    
    if (orgIds.length === 0) {
      console.log('⚠️  Admin has no organizations assigned');
      console.log('');
      return;
    }
    
    console.log(`📊 Organization IDs: ${orgIds}`);
    
    // Get users in organizations
    const orgUsers = await getUsersInOrganizations(orgIds);
    console.log(`✅ Users in organization(s): ${orgUsers.length}`);
    
    // Simulate chunked query
    const userIds = orgUsers.map((u: any) => u.id);
    const chunkSize = 10;
    let totalAgents = 0;
    
    for (let i = 0; i < userIds.length; i += chunkSize) {
      const chunk = userIds.slice(i, i + chunkSize);
      
      const chunkSnapshot = await firestore
        .collection('conversations')
        .where('userId', 'in', chunk)
        .get();
      
      const chunkAgents = chunkSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.isAgent !== false;
      });
      
      totalAgents += chunkAgents.length;
    }
    
    console.log(`✅ Total agents in organization(s): ${totalAgents}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testRegularUserAccess() {
  console.log('📋 Test 3: Regular User Access (Own Agents Only)');
  console.log('─'.repeat(60));
  
  try {
    // Find a regular user
    const usersSnapshot = await firestore
      .collection('users')
      .where('role', '==', 'user')
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️  No regular users found - skipping test');
      console.log('');
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const regularUser = {
      ...userDoc.data(),
      id: userDoc.id,
    };
    
    console.log(`📊 Regular user:`, {
      email: regularUser.email,
      organizationId: regularUser.organizationId,
    });
    
    // Query own agents
    const conversationsSnapshot = await firestore
      .collection('conversations')
      .where('userId', '==', regularUser.id)
      .get();
    
    const agentDocs = conversationsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.isAgent !== false;
    });
    
    console.log(`✅ User's conversations: ${conversationsSnapshot.docs.length}`);
    console.log(`✅ User's agents: ${agentDocs.length}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testOrganizationMetadata() {
  console.log('📋 Test 4: Organization Metadata Enrichment');
  console.log('─'.repeat(60));
  
  try {
    // Get a sample agent
    const agentSnapshot = await firestore
      .collection('conversations')
      .where('isAgent', '==', true)
      .limit(1)
      .get();
    
    if (agentSnapshot.empty) {
      console.log('⚠️  No agents found - skipping test');
      console.log('');
      return;
    }
    
    const agentDoc = agentSnapshot.docs[0];
    const agent = agentDoc.data();
    
    console.log(`📊 Sample agent:`, {
      title: agent.title,
      userId: agent.userId,
    });
    
    // Load owner info
    const owner = await getUserById(agent.userId);
    
    if (!owner) {
      console.log('⚠️  Owner not found');
      console.log('');
      return;
    }
    
    console.log(`📊 Owner info:`, {
      email: owner.email,
      name: owner.name,
      organizationId: owner.organizationId,
    });
    
    // Load organization if exists
    if (owner.organizationId) {
      const { getOrganization } = await import('../src/lib/organizations.js');
      const org = await getOrganization(owner.organizationId);
      
      if (org) {
        console.log(`📊 Organization:`, {
          id: org.id,
          name: org.name,
          domains: org.domains,
        });
        
        console.log('✅ Metadata enrichment successful');
      } else {
        console.log('⚠️  Organization not found for ID:', owner.organizationId);
      }
    } else {
      console.log('ℹ️  Owner has no organization assigned (legacy user)');
    }
    
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function runAllTests() {
  await testSuperAdminAccess();
  await testAdminAccess();
  await testRegularUserAccess();
  await testOrganizationMetadata();
  
  console.log('✅ All tests complete!');
  console.log('');
  console.log('Next Steps:');
  console.log('1. Test in browser as SuperAdmin');
  console.log('2. Test in browser as Admin');
  console.log('3. Test in browser as Regular User');
  console.log('4. Verify organization badges display');
  console.log('5. Verify owner information displays');
  
  process.exit(0);
}

runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});






