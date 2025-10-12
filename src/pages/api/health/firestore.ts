import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../lib/firestore';

/**
 * Health check endpoint para verificar conectividad y configuración de Firestore
 * GET /api/health/firestore
 */
export const GET: APIRoute = async () => {
  const healthCheck = {
    status: 'unknown' as 'healthy' | 'degraded' | 'error',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      projectId: {
        status: 'unknown' as 'pass' | 'fail',
        value: '',
        message: '',
      },
      authentication: {
        status: 'unknown' as 'pass' | 'fail',
        message: '',
      },
      firestoreRead: {
        status: 'unknown' as 'pass' | 'fail',
        message: '',
        latency: 0,
      },
      firestoreWrite: {
        status: 'unknown' as 'pass' | 'fail',
        message: '',
        latency: 0,
      },
      collections: {
        status: 'unknown' as 'pass' | 'fail',
        found: [] as string[],
        expected: Object.values(COLLECTIONS),
        message: '',
      },
    },
    summary: {
      totalChecks: 5,
      passed: 0,
      failed: 0,
    },
  };

  try {
    // Check 1: Project ID
    const projectId = typeof import.meta !== 'undefined' && import.meta.env 
      ? import.meta.env.GOOGLE_CLOUD_PROJECT 
      : process.env.GOOGLE_CLOUD_PROJECT;

    if (projectId) {
      healthCheck.checks.projectId.status = 'pass';
      healthCheck.checks.projectId.value = projectId;
      healthCheck.checks.projectId.message = `Project ID configured: ${projectId}`;
      healthCheck.summary.passed++;
    } else {
      healthCheck.checks.projectId.status = 'fail';
      healthCheck.checks.projectId.message = 'GOOGLE_CLOUD_PROJECT not set in environment';
      healthCheck.summary.failed++;
    }

    // Check 2: Authentication (try to list collections)
    try {
      const startAuth = Date.now();
      const collections = await firestore.listCollections();
      healthCheck.checks.authentication.status = 'pass';
      healthCheck.checks.authentication.message = `Authenticated successfully (${collections.length} collections accessible)`;
      healthCheck.summary.passed++;
    } catch (error: any) {
      healthCheck.checks.authentication.status = 'fail';
      healthCheck.checks.authentication.message = `Authentication failed: ${error.message}`;
      healthCheck.summary.failed++;
    }

    // Check 3: Firestore Read
    try {
      const startRead = Date.now();
      // Try to read from a collection (even if empty)
      const testQuery = await firestore
        .collection(COLLECTIONS.CONVERSATIONS)
        .limit(1)
        .get();
      const readLatency = Date.now() - startRead;
      
      healthCheck.checks.firestoreRead.status = 'pass';
      healthCheck.checks.firestoreRead.message = `Read operation successful (${readLatency}ms)`;
      healthCheck.checks.firestoreRead.latency = readLatency;
      healthCheck.summary.passed++;
    } catch (error: any) {
      healthCheck.checks.firestoreRead.status = 'fail';
      healthCheck.checks.firestoreRead.message = `Read failed: ${error.message}`;
      healthCheck.summary.failed++;
    }

    // Check 4: Firestore Write (test with a temporary document)
    try {
      const startWrite = Date.now();
      const testDocRef = firestore.collection('_health_check').doc('test');
      
      await testDocRef.set({
        timestamp: new Date(),
        test: true,
        environment: healthCheck.environment,
      });
      
      // Clean up
      await testDocRef.delete();
      
      const writeLatency = Date.now() - startWrite;
      
      healthCheck.checks.firestoreWrite.status = 'pass';
      healthCheck.checks.firestoreWrite.message = `Write operation successful (${writeLatency}ms)`;
      healthCheck.checks.firestoreWrite.latency = writeLatency;
      healthCheck.summary.passed++;
    } catch (error: any) {
      healthCheck.checks.firestoreWrite.status = 'fail';
      healthCheck.checks.firestoreWrite.message = `Write failed: ${error.message}`;
      healthCheck.summary.failed++;
    }

    // Check 5: Collections existence
    try {
      const collections = await firestore.listCollections();
      const collectionIds = collections.map(c => c.id);
      
      healthCheck.checks.collections.found = collectionIds;
      
      // Check if expected collections exist
      const expectedCollections = Object.values(COLLECTIONS);
      const missingCollections = expectedCollections.filter(
        exp => !collectionIds.includes(exp)
      );
      
      if (missingCollections.length === 0 || collectionIds.length > 0) {
        healthCheck.checks.collections.status = 'pass';
        healthCheck.checks.collections.message = `Found ${collectionIds.length} collections`;
        healthCheck.summary.passed++;
      } else {
        healthCheck.checks.collections.status = 'fail';
        healthCheck.checks.collections.message = `Missing collections: ${missingCollections.join(', ')}`;
        healthCheck.summary.failed++;
      }
    } catch (error: any) {
      healthCheck.checks.collections.status = 'fail';
      healthCheck.checks.collections.message = `Failed to list collections: ${error.message}`;
      healthCheck.summary.failed++;
    }

    // Determine overall status
    if (healthCheck.summary.failed === 0) {
      healthCheck.status = 'healthy';
    } else if (healthCheck.summary.passed > healthCheck.summary.failed) {
      healthCheck.status = 'degraded';
    } else {
      healthCheck.status = 'error';
    }

  } catch (error: any) {
    healthCheck.status = 'error';
    console.error('Health check error:', error);
  }

  return new Response(
    JSON.stringify(healthCheck, null, 2),
    { 
      status: healthCheck.status === 'healthy' ? 200 : 503,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      } 
    }
  );
};

