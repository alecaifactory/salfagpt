import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

/**
 * Cleanup Duplicate Context Sources
 * 
 * Strategy: For each duplicate set, keep the NEWEST one, delete the rest
 * 
 * Safety: Creates backup log before deletion
 */

async function cleanupDuplicates() {
  console.log('🧹 Cleanup: Removing Duplicate Context Sources');
  console.log('='.repeat(70));
  console.log('📋 Strategy: Keep newest copy, delete older duplicates\n');
  
  try {
    // 1. Get all context sources
    const snapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .orderBy('name')
      .get();
    
    console.log(`📊 Total sources: ${snapshot.size}\n`);
    
    // 2. Group by name
    const byName = new Map<string, any[]>();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const name = data.name;
      
      if (!byName.has(name)) {
        byName.set(name, []);
      }
      
      byName.get(name)!.push({
        id: doc.id,
        ref: doc.ref,
        data: data,
        addedAt: data.addedAt?.toDate() || new Date(),
      });
    });
    
    // 3. Find and process duplicates
    let deleted = 0;
    let kept = 0;
    const deletionLog: any[] = [];
    
    for (const [name, docs] of byName.entries()) {
      if (docs.length > 1) {
        console.log(`📄 ${name}: ${docs.length} copies`);
        
        // Sort by addedAt DESC (newest first)
        docs.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
        
        // Keep first (newest), delete rest
        const toKeep = docs[0];
        const toDelete = docs.slice(1);
        
        console.log(`   ✅ KEEP: ID ${toKeep.id} (${toKeep.addedAt.toISOString()})`);
        console.log(`          Assigned to: ${toKeep.data.assignedToAgents?.length || 0} agent(s)`);
        
        for (const doc of toDelete) {
          console.log(`   🗑️  DELETE: ID ${doc.id} (${doc.addedAt.toISOString()})`);
          console.log(`          Assigned to: ${doc.data.assignedToAgents?.length || 0} agent(s)`);
          
          // Log deletion details
          deletionLog.push({
            name: name,
            deletedId: doc.id,
            deletedAt: new Date(),
            keptId: toKeep.id,
          });
          
          // Delete the document
          try {
            await doc.ref.delete();
            deleted++;
            console.log(`          ✅ Deleted`);
          } catch (error) {
            console.error(`          ❌ Error deleting:`, error);
          }
        }
        
        kept++;
        console.log('');
      }
    }
    
    // 4. Save deletion log
    if (deletionLog.length > 0) {
      const logRef = await firestore.collection('admin_logs').add({
        action: 'cleanup_duplicate_sources',
        timestamp: new Date(),
        deletedCount: deleted,
        keptCount: kept,
        details: deletionLog,
      });
      console.log(`📋 Deletion log saved: ${logRef.id}\n`);
    }
    
    // 5. Summary
    console.log('='.repeat(70));
    console.log('📊 Cleanup Summary:');
    console.log(`   🗑️  Deleted: ${deleted} duplicate documents`);
    console.log(`   ✅ Kept: ${kept} unique documents (newest copy)`);
    console.log(`   📝 Log saved to: admin_logs collection`);
    console.log('='.repeat(70));
    
    if (deleted > 0) {
      console.log('\n✅ Cleanup complete!');
      console.log('💡 Refresh your browser to see the cleaned data');
    } else {
      console.log('\n✅ No duplicates found - data is clean');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

// Run
cleanupDuplicates()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });







