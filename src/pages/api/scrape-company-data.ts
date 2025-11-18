/**
 * Scrape Company Data from URL
 * 
 * Extracts company information from website using Gemini AI
 * - Company name
 * - Mission statement
 * - Vision statement
 * - Purpose
 * - Any other available company data
 * 
 * Created: 2025-11-11
 */

import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';

const GOOGLE_AI_API_KEY = typeof import.meta !== 'undefined' && import.meta.env 
  ? import.meta.env.GOOGLE_AI_API_KEY 
  : process.env.GOOGLE_AI_API_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch website content
    console.log('🌐 Scraping URL:', url);
    const websiteResponse = await fetch(url);
    
    if (!websiteResponse.ok) {
      throw new Error(`Failed to fetch URL: ${websiteResponse.status}`);
    }

    const html = await websiteResponse.text();
    
    // Extract text content (remove scripts, styles, etc.)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 50000); // Limit to 50k characters

    // Use Gemini to extract company information
    const genAI = new GoogleGenAI({ apiKey: GOOGLE_AI_API_KEY });
    
    const systemPrompt = `You are a company data extraction expert. 
Extract the following information from the provided website content:
- Company name (full legal name if available)
- Mission statement (what they aim to achieve)
- Vision statement (where they're headed)
- Purpose (why they exist)

Return ONLY a JSON object with these fields. If a field is not found, omit it from the response.
Do not include any markdown formatting or explanations.`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `Website URL: ${url}\n\nWebsite Content:\n${textContent}`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        maxOutputTokens: 2048,
      }
    });

    const extractedText = result.text || '{}';
    
    // Parse JSON response
    let companyData;
    try {
      // Remove markdown code blocks if present
      const cleanJson = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      companyData = JSON.parse(cleanJson);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      companyData = {
        companyName: '',
        mission: extractedText.substring(0, 500),
        vision: '',
        purpose: ''
      };
    }

    console.log('✅ Company data extracted:', companyData);

    return new Response(JSON.stringify({ companyData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error scraping company data:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to scrape company data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};





