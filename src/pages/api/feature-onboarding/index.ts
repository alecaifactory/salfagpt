// Feature Onboarding API
// GET: Get user's feature onboarding status

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getUserOnboarding } from '../../../lib/feature-onboarding';
import { getChangelogEntries } from '../../../lib/changelog';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user's onboarding records
    const onboarding = await getUserOnboarding(session.id);
    
    // Get changelog entries to enrich data
    const changelogEntries = await getChangelogEntries({ limit: 20 });
    
    // Combine data
    const features = changelogEntries.map(entry => {
      const userOnboarding = onboarding.find(o => o.featureId === entry.id);
      
      return {
        id: entry.id,
        title: entry.title,
        category: entry.category,
        releaseDate: entry.releaseDate,
        tutorialCompleted: userOnboarding?.tutorialCompleted || false,
        tutorialProgress: userOnboarding?.tutorialProgress || 0,
        dismissed: userOnboarding?.dismissed || false,
        changelogUrl: `/changelog#${entry.id}`
      };
    });

    // Filter to show only recent and not dismissed
    const relevantFeatures = features.filter(f => {
      // Show if not completed and not dismissed
      if (!f.tutorialCompleted && !f.dismissed) return true;
      
      // Show completed features from last 7 days
      const daysSinceRelease = (new Date().getTime() - new Date(f.releaseDate).getTime()) / (1000 * 60 * 60 * 24);
      return f.tutorialCompleted && daysSinceRelease <= 7;
    });

    return new Response(JSON.stringify({ features: relevantFeatures }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Feature onboarding API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};



