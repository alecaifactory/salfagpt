// Initialize Feature Onboarding for All Users
// Run with: npx tsx scripts/init-feature-onboarding.ts
// Creates onboarding records for all changelog features

import { Firestore } from '@google-cloud/firestore';

const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';
const firestore = new Firestore({ projectId });

async function initOnboarding() {
  console.log('🎓 Initializing feature onboarding for all users...\n');

  try {
    // Get all users
    const usersSnapshot = await firestore.collection('users').get();
    const userIds = usersSnapshot.docs.map(doc => doc.id);
    console.log(`👥 Found ${userIds.length} users\n`);

    // Get all changelog entries
    const changelogSnapshot = await firestore
      .collection('changelog_entries')
      .orderBy('releaseDate', 'desc')
      .get();
    
    console.log(`📚 Found ${changelogSnapshot.size} changelog entries\n`);

    let totalCreated = 0;

    // For each feature, create onboarding record for each user
    for (const changelogDoc of changelogSnapshot.docs) {
      const feature = changelogDoc.data();
      const featureId = changelogDoc.id;
      
      console.log(`📝 Processing: ${feature.title}`);

      // Default to 5 steps for tutorial
      const totalSteps = 5;

      for (const userId of userIds) {
        // Check if already exists
        const existing = await firestore
          .collection('feature_onboarding')
          .where('userId', '==', userId)
          .where('featureId', '==', featureId)
          .limit(1)
          .get();

        if (existing.empty) {
          await firestore.collection('feature_onboarding').add({
            featureId,
            userId,
            tutorialStarted: false,
            tutorialCompleted: false,
            tutorialProgress: 0,
            currentStep: 0,
            totalSteps,
            featureAccessed: false,
            timesAccessed: 0,
            dismissed: false,
            helpful: null,
            notificationSent: true,
            notificationSentAt: new Date(),
            notificationRead: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          totalCreated++;
        }
      }
      
      console.log(`   ✅ Created ${userIds.length} onboarding records`);
    }

    console.log(`\n🎉 Onboarding initialized!`);
    console.log(`   Total records created: ${totalCreated}`);
    console.log(`   Features: ${changelogSnapshot.size}`);
    console.log(`   Users: ${userIds.length}`);
    console.log(`\n📊 Each user now has:`);
    console.log(`   - ${changelogSnapshot.size} features to explore`);
    console.log(`   - Tutorial progress tracking`);
    console.log(`   - "Try It Now" buttons enabled`);
    console.log(`\n🔔 Feature Notification Center will show:`);
    console.log(`   - Orange dot for pending tutorials`);
    console.log(`   - Progress bars for started tutorials`);
    console.log(`   - Green checkmark for completed`);

  } catch (error) {
    console.error('❌ Failed to initialize:', error);
    process.exit(1);
  }

  process.exit(0);
}

initOnboarding();



