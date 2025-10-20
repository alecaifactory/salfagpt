import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

/**
 * Find Duplicate Context Sources
 * 
 * Problem: Multiple documents with same name but different IDs
 * This causes bulk operations to affect more documents than expected
 */

async function findDuplicates() {
  console.log('🔍 Finding Duplicate Context Sources');
  console.log('='.repeat(70));
  
  try {
    // Get all context sources
    const snapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .orderBy('name')
      .get();
    
    console.log(`📊 Total sources: ${snapshot.size}`);
    
    // Group by name
    const byName = new Map<string, Array<{id: string, addedAt: Date, assignedToAgents: string[]}>>();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const name = data.name;
      
      if (!byName.has(name)) {
        byName.set(name, []);
      }
      
      byName.get(name)!.push({
        id: doc.id,
        addedAt: data.addedAt?.toDate() || new Date(),
        assignedToAgents: data.assignedToAgents || [],
      });
    });
    
    // Find duplicates
    const duplicates: string[] = [];
    byName.forEach((docs, name) => {
      if (docs.length > 1) {
        duplicates.push(name);
      }
    });
    
    console.log(`\n📋 Found ${duplicates.length} documents with duplicates:\n`);
    
    // Show details
    duplicates.forEach(name => {
      const docs = byName.get(name)!;
      console.log(`📄 ${name}: ${docs.length} copies`);
      docs.forEach((doc, idx) => {
        console.log(`   [${idx + 1}] ID: ${doc.id}`);
        console.log(`       Added: ${doc.addedAt.toISOString()}`);
        console.log(`       Assigned to: ${doc.assignedToAgents.length} agent(s)`, doc.assignedToAgents);
      });
      console.log('');
    });
    
    // Summary
    console.log('='.repeat(70));
    console.log(`📊 Summary:`);
    console.log(`   Total documents: ${snapshot.size}`);
    console.log(`   Unique names: ${byName.size}`);
    console.log(`   Duplicates: ${duplicates.length}`);
    console.log(`   Total duplicate copies: ${duplicates.reduce((sum, name) => sum + (byName.get(name)!.length - 1), 0)}`);
    console.log('='.repeat(70));
    
    if (duplicates.length > 0) {
      console.log('\n⚠️  Action Required:');
      console.log('   Option 1: Run cleanup-duplicate-sources.ts to keep newest copy');
      console.log('   Option 2: Manually review and delete in Firebase Console');
    }
    
  } catch (error) {
    console.error('❌ Error finding duplicates:', error);
    throw error;
  }
}

// Run
findDuplicates()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

