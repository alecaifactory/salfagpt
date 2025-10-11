import type { APIRoute } from 'astro';
import { verifyAccess, createAccessDeniedResponse, createUnauthorizedResponse, UserRole } from '../../../lib/access-control';

export const POST: APIRoute = async ({ request }) => {
  // Verify Expert access or higher
  const userAccess = await verifyAccess(request, UserRole.EXPERT);
  
  if (!userAccess) {
    return createUnauthorizedResponse();
  }
  
  // Check if user has at least Expert role
  const allowedRoles = [UserRole.EXPERT, UserRole.ADMIN, UserRole.SUPERADMIN];
  if (!allowedRoles.includes(userAccess.role)) {
    return createAccessDeniedResponse('Expert access required');
  }

  try {
    const evaluation = await request.json();
    
    // Validate required fields
    if (!evaluation.conversationId) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'conversationId is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!evaluation.scores || typeof evaluation.scores !== 'object') {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'scores object is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // In production, this would:
    // 1. Store evaluation in Firestore (expert_evaluations collection)
    // 2. Update conversation status to 'evaluated'
    // 3. Update conversation qualityMetrics
    // 4. Trigger any necessary notifications
    
    const savedEvaluation = {
      id: `eval-${Date.now()}`,
      conversationId: evaluation.conversationId,
      expertId: userAccess.email,
      expertEmail: userAccess.email,
      evaluatedAt: new Date().toISOString(),
      scores: evaluation.scores,
      feedback: evaluation.feedback || '',
      issues: evaluation.issues || [],
      severity: evaluation.severity || 'low',
      flags: evaluation.flags || [],
      suggestions: evaluation.suggestions || '',
      metadata: {
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    };

    console.log('✅ Expert evaluation saved:', {
      evaluationId: savedEvaluation.id,
      conversationId: savedEvaluation.conversationId,
      expertId: savedEvaluation.expertId,
      overallScore: savedEvaluation.scores.overall,
    });

    return new Response(
      JSON.stringify({
        success: true,
        evaluation: savedEvaluation,
        message: 'Evaluation submitted successfully',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error submitting evaluation:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to submit evaluation',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

