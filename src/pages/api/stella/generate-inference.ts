/**
 * Stella AI Inference API
 * 
 * Generates contextual inference about user feedback:
 * - What page/feature they're on
 * - What problem they're highlighting
 * - Suggested priority
 * - Suggested category
 */

import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY ||
  (typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.GOOGLE_AI_API_KEY
    : undefined);

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { pageUrl, pageTitle, pageContext, selectionMode, selectionArea } = body;
    
    if (!GOOGLE_AI_API_KEY) {
      return new Response(JSON.stringify({
        error: 'AI API key not configured',
        // Fallback inference
        pageContext: pageTitle || 'Unknown page',
        identifiedIssue: 'User feedback pending',
        suggestedPriority: 'medium' as const,
        suggestedCategory: 'UI/UX',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const genAI = new GoogleGenAI({ apiKey: GOOGLE_AI_API_KEY });
    
    const prompt = `You are Stella, an AI Product Agent analyzing user feedback context.

**Page Information:**
- URL: ${pageUrl}
- Title: ${pageTitle}
- Selection Mode: ${selectionMode}
${selectionArea ? `- Selected Area: ${Math.round(selectionArea.width)}x${Math.round(selectionArea.height)}px at (${Math.round(selectionArea.x)}, ${Math.round(selectionArea.y)})` : ''}

**Page Content (first 2000 chars):**
${pageContext}

Based on this information, generate a concise inference in JSON format:

{
  "pageContext": "What feature/page is this? (max 50 chars)",
  "identifiedIssue": "What problem or improvement area do you identify? (max 100 chars)",
  "suggestedPriority": "low" | "medium" | "high" | "critical",
  "suggestedCategory": "UI/UX" | "Performance" | "Bug" | "Feature Request" | "Content" | "Navigation" | other
}

Be specific and actionable. Infer from the context what the user likely wants to report.`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3, // Lower for consistent categorization
        maxOutputTokens: 200,
      }
    });
    
    const text = result.text || '{}';
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').trim();
    }
    
    const inference = JSON.parse(jsonText);
    
    console.log('🤖 Stella AI Inference generated:', inference);
    
    return new Response(JSON.stringify(inference), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Failed to generate inference:', error);
    
    // Return fallback inference
    return new Response(JSON.stringify({
      pageContext: 'Application feedback',
      identifiedIssue: 'User feedback pending analysis',
      suggestedPriority: 'medium' as const,
      suggestedCategory: 'General',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};









