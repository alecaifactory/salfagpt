import type { APIRoute } from 'astro';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY || '');

/**
 * POST /api/extract-url
 * Extract content from a URL using Gemini AI
 * 
 * Body:
 * - url: string (URL to extract from)
 * - model: string (optional, default: gemini-2.5-flash)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { url, model = 'gemini-2.5-flash' } = body;

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🌐 Extracting content from URL: ${url}`);
    console.log(`   Model: ${model}`);

    const startTime = Date.now();

    // Fetch the URL content
    const fetchResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FlowBot/1.0; +https://flow.ai)',
      },
      redirect: 'follow',
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch URL: ${fetchResponse.status} ${fetchResponse.statusText}`);
    }

    const contentType = fetchResponse.headers.get('content-type') || '';
    const html = await fetchResponse.text();

    console.log(`✅ Fetched ${html.length} bytes`);
    console.log(`   Content-Type: ${contentType}`);

    // Extract text content using Gemini
    const geminiModel = genAI.getGenerativeModel({ model });
    
    const prompt = `Extract and structure the main content from this web page.

Instructions:
1. Extract the main text content, removing navigation, ads, footers
2. Preserve headings, lists, and structure
3. Include important links and their text
4. Ignore scripts, styles, and technical metadata
5. Format as clean, readable markdown

Web page content:
${html.substring(0, 100000)} ${html.length > 100000 ? '...(truncated)' : ''}

Extracted content:`;

    const result = await geminiModel.generateContent(prompt);
    const extractedText = result.response.text();

    const extractionTime = Date.now() - startTime;

    console.log(`✅ Extraction complete:`);
    console.log(`   Extracted: ${extractedText.length} characters`);
    console.log(`   Time: ${extractionTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        url,
        extractedText,
        metadata: {
          sourceUrl: url,
          contentType,
          originalSize: html.length,
          extractedSize: extractedText.length,
          extractionTime,
          model,
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ URL extraction error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Extraction failed'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

