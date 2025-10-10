import type { APIRoute } from 'astro';
import { clearSession } from '../../lib/auth';

export const GET: APIRoute = async (context) => {
  clearSession(context);
  return context.redirect('/');
};

export const POST: APIRoute = async (context) => {
  clearSession(context);
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

