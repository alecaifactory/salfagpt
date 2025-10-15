import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { GoogleGenAI } from '@google/genai';
import { firestore } from '../../../lib/firestore';

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_AI_API_KEY || ''
});

export const POST: APIRoute = async (context) => {
  const { request } = context;
  
  try {
    const session = getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { agentId, extractedText, fileName, uploadedBy } = await request.json();

    if (!agentId || !extractedText) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    console.log('📋 Parsing agent setup document:', fileName);

    // Use Gemini to extract structured data from the setup document
    const systemPrompt = `You are an expert at analyzing agent setup documents and extracting structured information.

Parse the following document and extract:
1. Agent Purpose - What is this agent designed to do?
2. Setup Instructions - How should the agent be configured?
3. Input Examples - What types of questions will users ask? (with categories)
4. Correct Output Examples - What are good responses? (with success criteria)
5. Incorrect Output Examples - What are bad responses? (with reasons why they're bad)
6. Domain Expert Info - Who defined these requirements?

Return ONLY a valid JSON object with this structure:
{
  "agentPurpose": "string describing the purpose",
  "setupInstructions": "string with setup guidance",
  "inputExamples": [
    {"question": "example question", "category": "category name"}
  ],
  "correctOutputs": [
    {"example": "good response example", "criteria": "why this is good"}
  ],
  "incorrectOutputs": [
    {"example": "bad response example", "reason": "why this is bad"}
  ],
  "domainExpert": {
    "name": "expert name or Unknown",
    "email": "expert email or Unknown",
    "department": "department or Unknown"
  }
}`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: extractedText,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1, // Low temperature for structured extraction
        maxOutputTokens: 8192,
      },
    });

    const responseText = result.text || '';
    
    // Parse JSON response
    let parsedData;
    try {
      // Remove markdown code blocks if present
      const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response as JSON:', responseText);
      throw new Error('Failed to parse setup document structure');
    }

    // Validate the structure
    if (!parsedData.agentPurpose || !parsedData.setupInstructions) {
      throw new Error('Incomplete setup document - missing required fields');
    }

    // Save to Firestore
    const setupDocData = {
      agentId,
      fileName,
      uploadedAt: new Date(),
      uploadedBy,
      extractedData: extractedText,
      agentPurpose: parsedData.agentPurpose,
      setupInstructions: parsedData.setupInstructions,
      inputExamples: parsedData.inputExamples || [],
      correctOutputs: parsedData.correctOutputs || [],
      incorrectOutputs: parsedData.incorrectOutputs || [],
      domainExpert: parsedData.domainExpert || {
        name: 'Unknown',
        email: 'Unknown',
        department: 'Unknown',
      },
      qualityMetrics: {
        overallScore: 0, // Will be calculated after evaluations
        lastEvaluatedAt: new Date(),
        evaluationCount: 0,
        accuracyScore: 0,
        responseTimeAvg: 0,
        userSatisfaction: 0,
        evaluationHistory: [],
      },
    };

    await firestore
      .collection('agent_setup_docs')
      .doc(agentId)
      .set(setupDocData);

    console.log('✅ Setup document parsed and saved for agent:', agentId);

    return new Response(JSON.stringify({
      success: true,
      setupDoc: setupDocData,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error parsing setup document:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to parse setup document',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

