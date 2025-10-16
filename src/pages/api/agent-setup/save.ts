import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Destructure ALL possible fields (old + new)
    const {
      agentId,
      fileName,
      uploadedAt,
      uploadedBy,
      // Core fields
      agentName,
      agentPurpose,
      setupInstructions,
      // NEW fields
      targetAudience,
      pilotUsers,
      tone,
      recommendedModel,
      expectedOutputFormat,
      expectedInputTypes,
      responseRequirements,
      requiredContextSources,
      domainExpert,
      // Examples
      inputExamples,
      correctOutputs,
      incorrectOutputs,
      expectedInputExamples,
      expectedOutputExamples,
      // Optional/legacy
      businessCase,
      qualityCriteria,
      undesirableOutputs,
      acceptanceCriteria
    } = body;

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'agentId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('💾 [API SAVE] Saving setup document for agent:', agentId);
    console.log('💾 [API SAVE] inputExamples received:', inputExamples);
    console.log('💾 [API SAVE] inputExamples count:', inputExamples?.length || 0);
    console.log('💾 [API SAVE] NEW - targetAudience:', targetAudience?.length || 0);
    console.log('💾 [API SAVE] NEW - pilotUsers:', pilotUsers?.length || 0);
    console.log('💾 [API SAVE] NEW - tone:', tone || 'N/A');
    console.log('💾 [API SAVE] NEW - recommendedModel:', recommendedModel || 'N/A');

    // Build data with all fields (filter undefined)
    const setupDocData: any = {
      agentId,
      fileName: fileName || agentName || 'Configuración extraída',
      uploadedAt: uploadedAt ? new Date(uploadedAt) : new Date(),
      uploadedBy: uploadedBy || 'system',
      
      // Core fields
      agentName: agentName || fileName || 'Agente',
      agentPurpose: agentPurpose || '',
      setupInstructions: setupInstructions || '',
      
      // NEW: User fields
      targetAudience: targetAudience || [],
      pilotUsers: pilotUsers || [],
      
      // NEW: Behavior fields
      tone: tone || '',
      recommendedModel: recommendedModel || 'gemini-2.5-flash',
      expectedOutputFormat: expectedOutputFormat || '',
      expectedInputTypes: expectedInputTypes || [],
      
      // Examples (support both old and new field names)
      inputExamples: inputExamples || expectedInputExamples || [],
      correctOutputs: correctOutputs || expectedOutputExamples || [],
      incorrectOutputs: incorrectOutputs || [],
      
      // Response requirements
      responseRequirements: responseRequirements || {},
      
      // Context sources
      requiredContextSources: requiredContextSources || [],
      
      // Domain expert
      domainExpert: domainExpert || {
        name: 'Unknown',
        email: 'Unknown',
        department: 'Unknown'
      }
    };
    
    // Add optional fields only if defined
    if (businessCase) setupDocData.businessCase = businessCase;
    if (qualityCriteria) setupDocData.qualityCriteria = qualityCriteria;
    if (undesirableOutputs) setupDocData.undesirableOutputs = undesirableOutputs;
    if (acceptanceCriteria) setupDocData.acceptanceCriteria = acceptanceCriteria;

    console.log('💾 [API SAVE] Final data to save:', {
      inputExamplesCount: setupDocData.inputExamples.length,
      correctOutputsCount: setupDocData.correctOutputs.length,
      hasPurpose: !!setupDocData.agentPurpose,
      targetAudienceCount: setupDocData.targetAudience.length,
      pilotUsersCount: setupDocData.pilotUsers.length,
      hasTone: !!setupDocData.tone,
      hasModel: !!setupDocData.recommendedModel
    });

    await firestore
      .collection('agent_setup_docs')
      .doc(agentId)
      .set(setupDocData);

    console.log('✅ [API SAVE] Setup document saved successfully to Firestore');
    console.log('✅ [API SAVE] Document path: agent_setup_docs/' + agentId);

    return new Response(
      JSON.stringify({ 
        success: true,
        agentId,
        inputExamplesCount: setupDocData.inputExamples.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [API SAVE] Error saving setup document:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to save setup document' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

