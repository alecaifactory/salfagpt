#!/usr/bin/env node

import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'salfagpt'
  });
}

const firestore = admin.firestore();

async function diagnoseArchived() {
  const userId = 'usr_uhwqffaqag1wrryd82tw'; // alec@getaifactory.com
  
  console.log('🔍 Diagnosing archived conversations for:', userId);
  console.log('='.repeat(60));
  
  // Get all conversations
  const snapshot = await firestore
    .collection('conversations')
    .where('userId', '==', userId)
    .orderBy('lastMessageAt', 'desc')
    .get();
  
  console.log('\n📊 Database Query Results:');
  console.log('  Total documents:', snapshot.size);
  
  // Count by status
  const byStatus = {
    archived: 0,
    active: 0,
    undefined: 0
  };
  
  snapshot.docs.forEach(doc => {
    const status = doc.data().status;
    if (status === 'archived') byStatus.archived++;
    else if (status === 'active') byStatus.active++;
    else byStatus.undefined++;
  });
  
  console.log('\n📈 Status Breakdown:');
  console.log('  Archived:', byStatus.archived);
  console.log('  Active:', byStatus.active);
  console.log('  Undefined (legacy):', byStatus.undefined);
  
  // Show archived samples
  const archived = snapshot.docs.filter(d => d.data().status === 'archived');
  console.log('\n📦 Archived Samples:');
  archived.slice(0, 5).forEach(doc => {
    const data = doc.data();
    console.log('  -', {
      id: doc.id.substring(0, 15) + '...',
      title: data.title,
      archivedFolder: data.archivedFolder || 'no-category',
      isAgent: data.isAgent,
      isAlly: data.isAlly
    });
  });
  
  // Count by archived category
  console.log('\n🗂️  Archived by Category:');
  const categories = {};
  archived.forEach(doc => {
    const category = doc.data().archivedFolder || 'uncategorized';
    categories[category] = (categories[category] || 0) + 1;
  });
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`  ${cat}:`, count);
  });
  
  // Simulate API filter logic
  console.log('\n🧪 Simulating API Filter (includeArchived=true):');
  let items = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      status: data.status, // Keep as is (including undefined)
    };
  });
  
  const includeArchived = true;
  const type = 'all';
  
  items = items.filter(item => {
    // Only exclude archived if includeArchived is false
    if (!includeArchived && item.status === 'archived') return false;
    
    // type === 'all'
    return true;
  });
  
  console.log('  Items after filter:', items.length);
  console.log('  Should match total:', items.length === snapshot.size);
  
  process.exit(0);
}

diagnoseArchived().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

