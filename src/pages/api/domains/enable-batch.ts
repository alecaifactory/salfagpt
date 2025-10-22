import type { APIRoute } from 'astro';
import { Firestore } from '@google-cloud/firestore';

// Initialize Firestore with explicit project
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0986191192';

let firestore: Firestore;
try {
  firestore = new Firestore({
    projectId: PROJECT_ID,
  });
} catch (error) {
  console.error('❌ Failed to initialize Firestore:', error);
}

/**
 * POST /api/domains/enable-batch
 * 
 * Batch enable domains (admin only)
 * This is a temporary endpoint to bootstrap initial domains
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { domains, adminEmail } = body;

    if (!domains || !Array.isArray(domains)) {
      return new Response(
        JSON.stringify({ error: 'domains array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!adminEmail) {
      return new Response(
        JSON.stringify({ error: 'adminEmail is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔧 Batch enabling domains:', {
      count: domains.length,
      adminEmail,
      timestamp: new Date().toISOString(),
    });

    const results = [];

    for (const domainInfo of domains) {
      const { domain, name, description } = domainInfo;
      
      try {
        // Check if domain exists
        const domainDoc = await firestore.collection('domains').doc(domain).get();
        
        if (domainDoc.exists) {
          const existingData = domainDoc.data();
          
          if (!existingData?.enabled) {
            // Enable it
            await firestore.collection('domains').doc(domain).update({
              enabled: true,
              updatedAt: new Date(),
            });
            
            console.log(`✅ Enabled existing domain: ${domain}`);
            results.push({ 
              domain, 
              status: 'success', 
              action: 'enabled',
              message: 'Domain enabled successfully' 
            });
          } else {
            console.log(`ℹ️  Domain already enabled: ${domain}`);
            results.push({ 
              domain, 
              status: 'success', 
              action: 'no_change',
              message: 'Domain already enabled' 
            });
          }
        } else {
          // Create new domain
          const domainData = {
            name: name || domain,
            enabled: true,
            createdBy: adminEmail,
            createdAt: new Date(),
            updatedAt: new Date(),
            allowedAgents: [],
            allowedContextSources: [],
            userCount: 0,
            description: description || `Domain created on ${new Date().toISOString()}`,
            settings: {},
          };
          
          await firestore.collection('domains').doc(domain).set(domainData);
          
          console.log(`✅ Created new domain: ${domain}`);
          results.push({ 
            domain, 
            status: 'success', 
            action: 'created',
            message: 'Domain created and enabled' 
          });
        }
      } catch (error) {
        console.error(`❌ Failed to process domain ${domain}:`, error);
        results.push({ 
          domain, 
          status: 'error', 
          action: 'failed',
          message: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'error').length;

    return new Response(
      JSON.stringify({ 
        success: true,
        results,
        summary: {
          total: domains.length,
          succeeded: successCount,
          failed: failCount,
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in batch enable domains:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to enable domains',
        details: error.stack 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

