/**
 * Generate Company Profile Content with AI
 * 
 * Uses Gemini AI to generate:
 * - Mission statements
 * - Vision statements  
 * - Purpose statements
 * - North Star Metric suggestions
 * - OKRs (Objectives & Key Results)
 * - KPIs (Key Performance Indicators)
 * 
 * Created: 2025-11-11
 */

import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';

const GOOGLE_AI_API_KEY = typeof import.meta !== 'undefined' && import.meta.env 
  ? import.meta.env.GOOGLE_AI_API_KEY 
  : process.env.GOOGLE_AI_API_KEY;

const GENERATION_PROMPTS: Record<string, (context: any) => string> = {
  mission: (ctx) => `Generate a compelling mission statement for ${ctx.companyName}. 
The mission should be clear, actionable, and inspiring (2-3 sentences max).
${ctx.url ? `Use information from their website: ${ctx.url}` : ''}
Return ONLY the mission statement text, no additional explanation.`,

  vision: (ctx) => `Generate an aspirational vision statement for ${ctx.companyName}.
The vision should describe where the company is headed in the next 5-10 years (2-3 sentences max).
${ctx.url ? `Use information from their website: ${ctx.url}` : ''}
Return ONLY the vision statement text, no additional explanation.`,

  purpose: (ctx) => `Generate a clear purpose statement for ${ctx.companyName}.
The purpose should answer "Why does this company exist?" in 1-2 sentences.
${ctx.url ? `Use information from their website: ${ctx.url}` : ''}
Return ONLY the purpose statement text, no additional explanation.`,

  northStarMetric: (ctx) => `Suggest the North Star Metric for ${ctx.companyName}.
${ctx.mission ? `Mission: ${ctx.mission}` : ''}
${ctx.vision ? `Vision: ${ctx.vision}` : ''}

The North Star Metric should be:
1. The ONE metric that best indicates product/company success
2. Measurable and actionable
3. Leading indicator of sustainable growth

Return ONLY a JSON object with this structure:
{
  "name": "Metric name",
  "unit": "unit of measurement",
  "description": "Why this metric matters (1 sentence)",
  "current": 0,
  "target": 1000
}

Examples:
- SaaS: Daily Active Users (DAU)
- E-commerce: Revenue Per Customer
- Marketplace: Weekly Active Transactions

No markdown, just the JSON object.`,

  okrs: (ctx) => `Generate 3 quarterly OKRs for ${ctx.companyName}.
${ctx.mission ? `Mission: ${ctx.mission}` : ''}
${ctx.vision ? `Vision: ${ctx.vision}` : ''}

Each OKR should have:
- 1 clear Objective
- 3 measurable Key Results

Return ONLY a JSON array with this structure:
[
  {
    "objective": "Objective statement",
    "keyResults": ["KR1", "KR2", "KR3"],
    "quarter": "Q1 2025"
  }
]

Make them specific, measurable, and ambitious but achievable.
No markdown, just the JSON array.`,

  kpis: (ctx) => `Generate 5 essential KPIs for ${ctx.companyName}.
${ctx.mission ? `Mission: ${ctx.mission}` : ''}
${ctx.northStarMetric ? `North Star Metric: ${ctx.northStarMetric.name}` : ''}

Return ONLY a JSON array with this structure:
[
  {
    "name": "KPI name",
    "current": 0,
    "target": 100,
    "unit": "unit",
    "category": "growth|efficiency|quality|retention"
  }
]

Focus on metrics that:
1. Support the North Star Metric
2. Cover different business areas
3. Are actionable and measurable

No markdown, just the JSON array.`,
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { companyName, url, mission, vision, northStarMetric, field } = body;

    if (!field || !GENERATION_PROMPTS[field]) {
      return new Response(JSON.stringify({ error: 'Invalid field' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!companyName) {
      return new Response(JSON.stringify({ error: 'Company name required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`🤖 Generating ${field} for ${companyName}...`);

    // Generate content with Gemini
    const genAI = new GoogleGenAI({ apiKey: GOOGLE_AI_API_KEY });
    
    const prompt = GENERATION_PROMPTS[field]({
      companyName,
      url,
      mission,
      vision,
      northStarMetric
    });

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    let content = result.text || '';
    
    // For JSON fields, parse and return as object
    if (['northStarMetric', 'okrs', 'kpis'].includes(field)) {
      try {
        // Remove markdown code blocks if present
        const cleanJson = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        content = JSON.parse(cleanJson);
      } catch (error) {
        console.error('Failed to parse JSON response:', error);
        return new Response(JSON.stringify({ error: 'Failed to parse generated content' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    console.log(`✅ Generated ${field} successfully`);

    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error generating company profile:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate content',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};





