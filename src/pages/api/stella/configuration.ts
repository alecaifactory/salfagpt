/**
 * Stella Configuration API
 * 
 * GET /api/stella/configuration - Get current Stella config
 * PUT /api/stella/configuration - Update Stella config
 * 
 * Access: SuperAdmin only (alec@getaifactory.com)
 * 
 * Security:
 * - Verifies session
 * - Checks email = alec@getaifactory.com
 * - Audit logs all changes
 */

import type { APIRoute } from 'astro';
import { firestore, getEnvironmentSource } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';
import type { StellaConfiguration, StellaConfigUpdate } from '../../../types/stella-config';
import { DEFAULT_STELLA_CONFIG } from '../../../types/stella-config';

const STELLA_CONFIG_ID = 'stella-config';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify session
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get user email
    const userDoc = await firestore.collection('users').doc(session.id).get();
    const userEmail = userDoc.data()?.email;
    
    // CRITICAL: Only alec@getaifactory.com can access
    if (userEmail !== 'alec@getaifactory.com') {
      return new Response(JSON.stringify({ error: 'Forbidden - SuperAdmin only' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Load Stella configuration
    const configDoc = await firestore
      .collection('stella_configuration')
      .doc(STELLA_CONFIG_ID)
      .get();
    
    if (!configDoc.exists) {
      // Return default configuration
      return new Response(
        JSON.stringify({
          ...DEFAULT_STELLA_CONFIG,
          id: STELLA_CONFIG_ID,
          createdAt: new Date(),
          updatedAt: new Date(),
          updatedBy: session.id,
          updatedByEmail: userEmail,
          source: getEnvironmentSource(),
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    const config = configDoc.data() as StellaConfiguration;
    
    return new Response(
      JSON.stringify({
        ...config,
        updatedAt: config.updatedAt?.toDate?.() || config.updatedAt,
        createdAt: config.createdAt?.toDate?.() || config.createdAt,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error loading Stella configuration:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to load configuration' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify session
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get user email
    const userDoc = await firestore.collection('users').doc(session.id).get();
    const userEmail = userDoc.data()?.email;
    
    // CRITICAL: Only alec@getaifactory.com can update
    if (userEmail !== 'alec@getaifactory.com') {
      return new Response(JSON.stringify({ error: 'Forbidden - SuperAdmin only' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const updates: StellaConfigUpdate = await request.json();
    
    // Load current config
    const configDoc = await firestore
      .collection('stella_configuration')
      .doc(STELLA_CONFIG_ID)
      .get();
    
    const currentConfig = configDoc.exists
      ? configDoc.data()
      : {
          ...DEFAULT_STELLA_CONFIG,
          id: STELLA_CONFIG_ID,
          createdAt: new Date(),
        };
    
    // Merge updates
    const updatedConfig: StellaConfiguration = {
      ...currentConfig,
      ...updates,
      id: STELLA_CONFIG_ID,
      updatedBy: session.id,
      updatedByEmail: userEmail,
      updatedAt: new Date(),
      source: getEnvironmentSource(),
      version: (currentConfig.version || 0) + 1,
      previousVersionId: configDoc.exists ? configDoc.id : undefined,
    } as StellaConfiguration;
    
    // Save to Firestore
    await firestore
      .collection('stella_configuration')
      .doc(STELLA_CONFIG_ID)
      .set(updatedConfig);
    
    // Audit log
    await firestore.collection('stella_config_audit').add({
      configId: STELLA_CONFIG_ID,
      updatedBy: session.id,
      updatedByEmail: userEmail,
      changes: updates,
      version: updatedConfig.version,
      timestamp: new Date(),
      source: getEnvironmentSource(),
    });
    
    console.log('✅ Stella configuration updated by:', userEmail, '| Version:', updatedConfig.version);
    
    return new Response(
      JSON.stringify({
        success: true,
        configuration: updatedConfig,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error updating Stella configuration:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

