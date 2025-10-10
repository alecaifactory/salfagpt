import type { APIRoute } from 'astro';
import { BigQuery } from '@google-cloud/bigquery';
import { Firestore } from '@google-cloud/firestore';

export const GET: APIRoute = async () => {
  const results = {
    timestamp: new Date().toISOString(),
    project: process.env.GOOGLE_CLOUD_PROJECT || 'NOT SET',
    tests: {} as Record<string, any>,
  };

  try {
    // Test 1: BigQuery Connection
    console.log('🧪 Testing BigQuery...');
    try {
      const bigquery = new BigQuery({
        projectId: process.env.GOOGLE_CLOUD_PROJECT,
      });
      
      const [datasets] = await bigquery.getDatasets();
      results.tests.bigquery = {
        status: 'success',
        message: `Connected! Found ${datasets.length} dataset(s)`,
        datasets: datasets.map(d => d.id),
      };
      console.log('✅ BigQuery test passed');
    } catch (error: any) {
      results.tests.bigquery = {
        status: 'error',
        message: error.message,
      };
      console.error('❌ BigQuery test failed:', error.message);
    }

    // Test 2: Firestore Connection
    console.log('🧪 Testing Firestore...');
    try {
      const firestore = new Firestore({
        projectId: process.env.GOOGLE_CLOUD_PROJECT,
      });
      
      // Try to access collections
      const collections = await firestore.listCollections();
      results.tests.firestore = {
        status: 'success',
        message: `Connected! Found ${collections.length} collection(s)`,
        collections: collections.map(c => c.id),
      };
      console.log('✅ Firestore test passed');
    } catch (error: any) {
      results.tests.firestore = {
        status: 'error',
        message: error.message,
      };
      console.error('❌ Firestore test failed:', error.message);
    }

    // Test 3: Environment Check
    console.log('🧪 Checking environment...');
    results.tests.environment = {
      status: 'success',
      googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT || 'NOT SET',
      nodeEnv: process.env.NODE_ENV || 'NOT SET',
      hasGoogleCreds: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      credPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || 'Using ADC (Application Default Credentials)',
    };

    // Overall status
    const allPassed = Object.values(results.tests).every(
      (test: any) => test.status === 'success'
    );
    
    results.tests.overall = {
      status: allPassed ? 'success' : 'partial',
      message: allPassed 
        ? '🎉 All GCP services authenticated successfully! Workload Identity is working!' 
        : '⚠️ Some services failed. Check individual test results.',
    };

    return new Response(JSON.stringify(results, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Test endpoint error:', error);
    return new Response(
      JSON.stringify({
        error: 'Test failed',
        message: error.message,
        stack: error.stack,
      }, null, 2),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

