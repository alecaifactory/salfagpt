import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

/**
 * POST /api/domains/enrich-web
 * Scrapes web information for a domain and stores it in Firestore
 * 
 * Body:
 * - domainId: string (e.g., 'maqsa.cl')
 * - websiteUrl?: string (optional, defaults to http://domainId)
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { domainId, websiteUrl } = body;

    if (!domainId) {
      return new Response(
        JSON.stringify({ error: 'domainId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update status to 'scraping'
    const domainRef = firestore
      .collection(COLLECTIONS.ORGANIZATIONS)
      .doc(domainId);

    await domainRef.update({
      'companyInfo.webData.status': 'scraping',
      'companyInfo.webData.scrapedBy': session.email,
      updatedAt: new Date(),
    });

    // Determine URL to scrape
    const targetUrl = websiteUrl || `https://${domainId}`;

    console.log(`🌐 Starting web scrape for domain: ${domainId}`);
    console.log(`   URL: ${targetUrl}`);

    // Fetch the website content
    const fetchResponse = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FlowBot/1.0; +https://flow.ai)',
      },
      redirect: 'follow',
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch ${targetUrl}: ${fetchResponse.status}`);
    }

    const html = await fetchResponse.text();

    // Extract structured data using simple parsing
    const extractedData = extractCompanyInfo(html, targetUrl);

    // Use Gemini AI to analyze and structure the data
    const aiAnalysis = await analyzeCompanyWithAI(extractedData, domainId);

    // Store results in Firestore
    await domainRef.update({
      'companyInfo.webData': {
        scrapedAt: new Date(),
        scrapedBy: session.email,
        websiteUrl: targetUrl,
        aboutText: extractedData.aboutText,
        services: extractedData.services,
        products: extractedData.products,
        industry: extractedData.industry,
        socialLinks: extractedData.socialLinks,
        rawData: html.substring(0, 50000), // Store first 50KB
        status: 'completed',
        error: null,
      },
      'companyInfo.aiAnalysis': aiAnalysis,
      updatedAt: new Date(),
    });

    console.log(`✅ Web scraping completed for ${domainId}`);

    return new Response(
      JSON.stringify({
        success: true,
        domainId,
        extractedData,
        aiAnalysis,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error enriching domain:', error);

    // Update status to 'error'
    const body = await request.json().catch(() => ({}));
    const { domainId } = body;

    if (domainId) {
      try {
        await firestore
          .collection(COLLECTIONS.ORGANIZATIONS)
          .doc(domainId)
          .update({
            'companyInfo.webData.status': 'error',
            'companyInfo.webData.error': error instanceof Error ? error.message : 'Unknown error',
            updatedAt: new Date(),
          });
      } catch (updateError) {
        console.error('Failed to update error status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to enrich domain',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * Extract company information from HTML
 */
function extractCompanyInfo(html: string, url: string): {
  aboutText: string;
  services: string[];
  products: string[];
  industry: string;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
} {
  // Remove script and style tags
  const cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Extract text content
  const textContent = cleanHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 10000); // First 10K chars

  // Find about text (look for common patterns)
  const aboutPatterns = [
    /about us[:\s]+([\s\S]{100,500})/i,
    /quienes somos[:\s]+([\s\S]{100,500})/i,
    /nosotros[:\s]+([\s\S]{100,500})/i,
    /sobre nosotros[:\s]+([\s\S]{100,500})/i,
  ];

  let aboutText = '';
  for (const pattern of aboutPatterns) {
    const match = textContent.match(pattern);
    if (match) {
      aboutText = match[1].substring(0, 500);
      break;
    }
  }

  if (!aboutText) {
    // Fallback: first paragraph-like text
    aboutText = textContent.substring(0, 500);
  }

  // Extract social links
  const socialLinks: any = {};
  
  const linkedinMatch = html.match(/linkedin\.com\/company\/([a-zA-Z0-9-]+)/i);
  if (linkedinMatch) socialLinks.linkedin = `https://linkedin.com/company/${linkedinMatch[1]}`;
  
  const twitterMatch = html.match(/twitter\.com\/([a-zA-Z0-9_]+)/i);
  if (twitterMatch) socialLinks.twitter = `https://twitter.com/${twitterMatch[1]}`;
  
  const facebookMatch = html.match(/facebook\.com\/([a-zA-Z0-9.-]+)/i);
  if (facebookMatch) socialLinks.facebook = `https://facebook.com/${facebookMatch[1]}`;

  // Simple keyword extraction for services/products
  const services: string[] = [];
  const products: string[] = [];

  // These would be improved with NLP
  const serviceKeywords = ['servicio', 'service', 'consultoría', 'consulting'];
  const productKeywords = ['producto', 'product', 'solución', 'solution'];

  return {
    aboutText,
    services,
    products,
    industry: 'Unknown', // Would need classification
    socialLinks,
  };
}

/**
 * Use Gemini AI to analyze company data
 */
async function analyzeCompanyWithAI(extractedData: any, domainId: string): Promise<{
  generatedAt: Date;
  summary: string;
  strengths: string[];
  focusAreas: string[];
  relevanceScore: number;
}> {
  try {
    // Import Gemini AI
    const { GoogleGenAI } = await import('@google/genai');
    const genAI = new GoogleGenAI({ 
      apiKey: process.env.GOOGLE_AI_API_KEY || '' 
    });

    const prompt = `Analyze this company based on their website content:

Domain: ${domainId}
About: ${extractedData.aboutText}

Provide a JSON response with:
{
  "summary": "2-3 sentence company summary",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "focusAreas": ["focus area 1", "focus area 2"],
  "relevanceScore": 0-100 (how relevant is this company to AI/automation tools),
  "suggestedIndustry": "industry classification"
}`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      },
    });

    const text = result.text || '{}';
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      generatedAt: new Date(),
      summary: analysis.summary || 'No summary available',
      strengths: analysis.strengths || [],
      focusAreas: analysis.focusAreas || [],
      relevanceScore: analysis.relevanceScore || 50,
    };
  } catch (error) {
    console.error('Error analyzing with AI:', error);
    
    // Fallback to basic analysis
    return {
      generatedAt: new Date(),
      summary: `Company operating under domain ${domainId}`,
      strengths: [],
      focusAreas: [],
      relevanceScore: 50,
    };
  }
}



