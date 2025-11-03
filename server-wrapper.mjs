/**
 * Server Wrapper for Cloud Run
 * Fixes the hardcoded port issue in Astro build output
 * 
 * Problem: Astro bakes port 3000 into dist/server/entry.mjs at build time
 * Solution: Import handler and create custom HTTP server with Cloud Run's PORT
 */

import { handler } from './dist/server/entry.mjs';
import http from 'node:http';

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

console.log('🚀 Starting Salfagpt server (Cloud Run)...');
console.log(`📍 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`🌐 Project: ${process.env.GOOGLE_CLOUD_PROJECT}`);
console.log(`📡 Port: ${PORT} (from env: ${process.env.PORT || 'default'})`);
console.log(`🔗 Host: ${HOST}`);

// Create HTTP server using Astro's request handler
// This bypasses the hardcoded port in entry.mjs
const server = http.createServer((req, res) => {
  // Convert Node.js request to Astro Request
  handler(req, res);
});

server.listen(PORT, HOST, (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
  console.log(`✅ Server listening on ${HOST}:${PORT}`);
  console.log(`🌐 Ready to accept requests`);
  console.log(`📝 Auth routes: /auth/login, /auth/callback, /auth/logout`);
});

// Error handling
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.error(`💡 Another process might be running on this port`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`📴 ${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  // Force shutdown after 10s
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

