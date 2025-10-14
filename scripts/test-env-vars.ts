#!/usr/bin/env tsx
/**
 * Test Environment Variables Loading
 * 
 * Verifica que las variables de entorno se carguen correctamente
 */

console.log('🔍 Testing Environment Variables\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Load .env manually
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

console.log('📁 Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Error loading .env:', result.error);
} else {
  console.log('✅ .env loaded successfully\n');
}

// Check critical variables
const criticalVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'JWT_SECRET',
  'PUBLIC_BASE_URL',
  'GOOGLE_CLOUD_PROJECT',
  'GOOGLE_AI_API_KEY',
];

console.log('🔑 Critical Variables:\n');

let allPresent = true;
criticalVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const display = value 
    ? (varName.includes('SECRET') || varName.includes('KEY') 
      ? `***${value.slice(-10)}` 
      : value.substring(0, 50) + (value.length > 50 ? '...' : ''))
    : 'NOT SET';
  
  console.log(`${status} ${varName}: ${display}`);
  
  if (!value) allPresent = false;
});

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (allPresent) {
  console.log('✅ All critical variables are set!');
} else {
  console.log('❌ Some critical variables are missing!');
  console.log('\n💡 Solution:');
  console.log('   1. Check .env file exists in project root');
  console.log('   2. Verify all variables are set');
  console.log('   3. Restart dev server: npm run dev');
}

console.log('');

// Test OAuth2Client initialization
console.log('🔐 Testing OAuth2 Client Initialization:\n');

try {
  const { OAuth2Client } = await import('google-auth-library');
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
  
  console.log('Config:');
  console.log(`  clientId: ${clientId ? '***' + clientId.slice(-10) : 'NOT SET'}`);
  console.log(`  clientSecret: ${clientSecret ? '***' + clientSecret.slice(-10) : 'NOT SET'}`);
  console.log(`  redirectUri: ${baseUrl}/auth/callback`);
  console.log('');
  
  if (!clientId) {
    console.error('❌ GOOGLE_CLIENT_ID is not set!');
    console.log('💡 This will cause "Missing required parameter: client_id" error');
  } else if (!clientSecret) {
    console.error('❌ GOOGLE_CLIENT_SECRET is not set!');
  } else {
    const oauth2Client = new OAuth2Client(
      clientId,
      clientSecret,
      `${baseUrl}/auth/callback`
    );
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      prompt: 'consent',
    });
    
    console.log('✅ OAuth2Client initialized successfully!');
    console.log('✅ Auth URL generated successfully!');
    console.log(`\nAuth URL (first 100 chars):\n${authUrl.substring(0, 100)}...`);
  }
} catch (error) {
  console.error('❌ Error testing OAuth2Client:', error);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');



