// Delete old changelog entries before re-seeding
import { firestore } from '../src/lib/firestore.js';

async function deleteOldEntries() {
  console.log('🗑️ Deleting old changelog entries...\n');
  
  const snapshot = await firestore.collection('changelog_entries').get();
  const batch = firestore.batch();
  
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  
  await batch.commit();
  console.log(`✅ Deleted ${snapshot.size} old changelog entries\n`);
  process.exit(0);
}

deleteOldEntries();

