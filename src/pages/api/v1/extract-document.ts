/**
 * Flow Vision API v1 - Document Extraction
 * 
 * POST /api/v1/extract-document
 * 
 * Purpose: Public API endpoint for external developers
 * Authentication: API key (Bearer token)
 * Rate limiting: Based on organization tier
 * 
 * Wraps the internal extract-document endpoint with:
 * - API key authentication
 * - Quota enforcement
 * - Usage tracking
 * - Standardized response format
 */

import type { APIRoute } from 'astro';
import { validateAPIKey, checkQuotas, logAPIUsage } from '../../../lib/api-management';
import type { VisionAPIResponse } from '../../../types/api-system';

export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  
  try {
    // ============================================================================
    // 1. AUTHENTICATION
    // ============================================================================
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid Authorization header. Use: Bearer <api_key>',
        },
      } as VisionAPIResponse, 401);
    }
    
    const apiKey = authHeader.replace('Bearer ', '');
    
    // Validate API key
    const validation = await validateAPIKey(apiKey);
    if (!validation.valid || !validation.organization) {
      return jsonResponse({
        success: false,
        error: {
          code: validation.error?.code || 'INVALID_KEY',
          message: validation.error?.message || 'Invalid API key',
        },
      } as VisionAPIResponse, 401);
    }
    
    const organization = validation.organization;
    const scopes = validation.scopes || [];
    
    // Check required scope
    if (!scopes.includes('vision:write')) {
      return jsonResponse({
        success: false,
        error: {
          code: 'INSUFFICIENT_SCOPE',
          message: 'API key requires vision:write scope',
        },
      } as VisionAPIResponse, 403);
    }
    
    // ============================================================================
    // 2. QUOTA ENFORCEMENT
    // ============================================================================
    
    const quotaCheck = await checkQuotas(organization.id);
    if (!quotaCheck.allowed) {
      return jsonResponse({
        success: false,
        error: {
          code: 'QUOTA_EXCEEDED',
          message: quotaCheck.reason || 'Quota limit reached',
          quota: quotaCheck.quotas,
        },
      } as VisionAPIResponse, 403);
    }
    
    // ============================================================================
    // 3. PARSE REQUEST
    // ============================================================================
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const model = formData.get('model') as string || 'gemini-2.5-flash';
    const extractionMethod = formData.get('extractionMethod') as string || 'vision-api';
    const webhookUrl = formData.get('webhookUrl') as string | undefined;
    
    if (!file) {
      return jsonResponse({
        success: false,
        error: {
          code: 'MISSING_FILE',
          message: 'No file provided in request',
        },
      } as VisionAPIResponse, 400);
    }
    
    // Validate file size against org quota
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > organization.quotas.maxFileSize) {
      return jsonResponse({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size ${fileSizeMB.toFixed(2)}MB exceeds your quota limit of ${organization.quotas.maxFileSize}MB`,
          fileSize: file.size,
          maxSize: organization.quotas.maxFileSize * 1024 * 1024,
        },
      } as VisionAPIResponse, 400);
    }
    
    // ============================================================================
    // 4. FORWARD TO INTERNAL EXTRACTION ENDPOINT
    // ============================================================================
    
    // Create new form data with additional metadata
    const internalFormData = new FormData();
    internalFormData.append('file', file);
    internalFormData.append('model', model);
    internalFormData.append('extractionMethod', extractionMethod);
    internalFormData.append('apiOrganizationId', organization.id);
    internalFormData.append('apiKey', 'internal'); // Mark as API request
    
    // Call internal endpoint
    const baseUrl = request.url.replace('/api/v1/extract-document', '');
    const internalResponse = await fetch(`${baseUrl}/api/extract-document`, {
      method: 'POST',
      body: internalFormData,
    });
    
    const result = await internalResponse.json();
    
    // ============================================================================
    // 5. HANDLE RESPONSE
    // ============================================================================
    
    const duration = Date.now() - startTime;
    const success = internalResponse.ok;
    
    // Log usage
    await logAPIUsage(
      organization.id,
      validation.organization.id, // Use org ID as key ID for now
      '/api/v1/extract-document',
      'POST',
      internalResponse.status,
      success,
      {
        fileType: file.type,
        fileSize: file.size,
        model: model,
        extractionMethod: extractionMethod,
        tokensUsed: result.extractedData ? estimateTokens(result.extractedData) : undefined,
        costUSD: result.metadata?.cost,
        durationMs: duration,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        errorMessage: result.error,
        errorCode: result.errorCode,
      }
    );
    
    // ============================================================================
    // 6. FORMAT RESPONSE
    // ============================================================================
    
    if (success) {
      // Check if async processing (large file)
      const isAsync = fileSizeMB > 50;
      
      if (isAsync) {
        // Return job ID for status polling
        return jsonResponse({
          success: true,
          jobId: result.jobId || `job_${Date.now()}`,
          status: 'processing',
          estimatedCompletion: new Date(Date.now() + 300000).toISOString(), // 5 min estimate
          webhookUrl: webhookUrl,
          message: 'Large file processing asynchronously. Use /api/v1/jobs/{jobId} to check status.',
        } as VisionAPIResponse, 202);
      }
      
      // Return synchronous result
      return jsonResponse({
        success: true,
        documentId: result.sourceId,
        extractedText: result.extractedData,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          pageCount: result.metadata?.pageCount,
          model: model,
          extractionMethod: extractionMethod,
          tokensUsed: result.extractedData ? estimateTokens(result.extractedData) : 0,
          costUSD: result.metadata?.cost || 0,
          processingTime: duration,
        },
      } as VisionAPIResponse, 200);
    } else {
      // Error from internal endpoint
      return jsonResponse({
        success: false,
        error: {
          code: result.errorCode || 'EXTRACTION_FAILED',
          message: result.error || 'Failed to extract document',
        },
      } as VisionAPIResponse, internalResponse.status);
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('❌ API v1 extract-document error:', error);
    
    return jsonResponse({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
    } as VisionAPIResponse, 500);
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Standard JSON response helper
 */
function jsonResponse(data: any, status: number): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'X-Flow-Version': '1.0.0',
      'X-RateLimit-Limit': '1000', // TODO: Get from org quotas
      'X-RateLimit-Remaining': '950', // TODO: Calculate from usage
    },
  });
}

/**
 * Estimate tokens from text (rough estimate)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

