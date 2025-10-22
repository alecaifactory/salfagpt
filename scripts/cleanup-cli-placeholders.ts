import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

/**
 * Cleanup Script: Remove 'cli-upload' placeholder from assignedToAgents
 * 
 * Problem: CLI documents have assignedToAgents = ['cli-upload'] by default
 * This placeholder was being merged with actual agent IDs, causing issues
 * 
 * Solution: Remove 'cli-upload' from all documents, keep only real agent IDs
 */

async function cleanupCLIPlaceholders() {
  console.log('🧹 Cleanup: Removing CLI placeholders from assignedToAgents');
  console.log('=' .repeat(60));
  
  try {
    // 1. Get all context sources
    const snapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .get();
    
    console.log(`📊 Found ${snapshot.size} context sources`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    // 2. Process each document
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const assignedToAgents = data.assignedToAgents || [];
      
      // Check if it has the CLI placeholder
      if (assignedToAgents.includes('cli-upload')) {
        console.log(`\n🔍 Processing: ${data.name}`);
        console.log(`   Current assignedToAgents:`, assignedToAgents);
        
        // Filter out 'cli-upload'
        const cleaned = assignedToAgents.filter((id: string) => id !== 'cli-upload');
        
        console.log(`   Cleaned assignedToAgents:`, cleaned);
        
        try {
          // Update the document
          await doc.ref.update({
            assignedToAgents: cleaned,
            updatedAt: new Date(),
          });
          
          console.log(`   ✅ Updated: ${data.name}`);
          console.log(`      Removed 'cli-upload', kept ${cleaned.length} agent(s)`);
          updated++;
        } catch (error) {
          console.error(`   ❌ Error updating ${data.name}:`, error);
          errors++;
        }
      } else {
        // No CLI placeholder - skip
        skipped++;
      }
    }
    
    // 3. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Cleanup Summary:');
    console.log(`   ✅ Updated: ${updated} documents`);
    console.log(`   ⏭️  Skipped: ${skipped} documents (no placeholder)`);
    console.log(`   ❌ Errors: ${errors} documents`);
    console.log('='.repeat(60));
    
    if (updated > 0) {
      console.log('\n✅ Cleanup complete! The CLI placeholder has been removed.');
      console.log('💡 Documents now only have real agent IDs in assignedToAgents');
    } else {
      console.log('\n✅ No documents needed cleanup');
    }
    
  } catch (error) {
    console.error('❌ Cleanup script failed:', error);
    throw error;
  }
}

// Run the cleanup
cleanupCLIPlaceholders()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });







