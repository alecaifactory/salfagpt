import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      agentId,
      fileName,
      uploadedAt,
      uploadedBy,
      agentPurpose,
      setupInstructions,
      inputExamples,
      correctOutputs,
      incorrectOutputs
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

    const setupDocData = {
      agentId,
      fileName: fileName || 'Configuración extraída',
      uploadedAt: uploadedAt ? new Date(uploadedAt) : new Date(),
      uploadedBy: uploadedBy || 'system',
      agentPurpose: agentPurpose || '',
      setupInstructions: setupInstructions || '',
      inputExamples: inputExamples || [],
      correctOutputs: correctOutputs || [],
      incorrectOutputs: incorrectOutputs || [],
      domainExpert: {
        name: 'Unknown',
        email: 'Unknown',
        department: 'Unknown'
      }
    };

    console.log('💾 [API SAVE] Final data to save:', {
      inputExamplesCount: setupDocData.inputExamples.length,
      correctOutputsCount: setupDocData.correctOutputs.length,
      hasPurpose: !!setupDocData.agentPurpose
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

