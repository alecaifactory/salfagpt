/**
 * Production Server Entry Point
 * Starts the Astro Node.js standalone server
 */

import { startServer } from './dist/server/entry.mjs';

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

console.log('🚀 Starting Salfagpt server...');
console.log(`📍 Environment: ${process.env.NODE_ENV}`);
console.log(`🌐 Project: ${process.env.GOOGLE_CLOUD_PROJECT}`);
console.log(`📡 Port: ${PORT}`);
console.log(`🔗 Host: ${HOST}`);

// Start the Astro server
startServer({
  port: parseInt(PORT, 10),
  host: HOST,
});

console.log(`✅ Server listening on ${HOST}:${PORT}`);

