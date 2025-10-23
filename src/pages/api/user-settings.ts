import type { APIRoute } from 'astro';
import { getUserSettings, saveUserSettings } from '../../lib/firestore';

// GET /api/user-settings?userId=xxx - Get user settings
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const settings = await getUserSettings(userId);

    if (!settings) {
      // Return default settings if none exist
      return new Response(
        JSON.stringify({
          userId,
          preferredModel: 'gemini-2.5-flash',
          systemPrompt: 'Eres un asistente de IA útil, preciso y amigable. Proporciona respuestas claras y concisas mientras eres exhaustivo cuando sea necesario. Sé respetuoso y profesional en todas las interacciones.',
          language: 'es',
          theme: 'light', // Default theme
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error getting user settings:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get user settings' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST /api/user-settings - Save user settings
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, preferredModel, systemPrompt, language, theme } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const settings = await saveUserSettings(userId, {
      preferredModel: preferredModel || 'gemini-2.5-flash',
      systemPrompt: systemPrompt || 'Eres un asistente de IA útil, preciso y amigable. Proporciona respuestas claras y concisas mientras eres exhaustivo cuando sea necesario. Sé respetuoso y profesional en todas las interacciones.',
      language: language || 'es',
      theme: theme || 'light', // Default to 'light' if not provided
    });

    console.log('✅ User settings saved:', userId, 'theme:', settings.theme);

    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error saving user settings:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to save user settings' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

