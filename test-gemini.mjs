import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

// Load API key from .env.salfacorp
const envContent = fs.readFileSync('.env.salfacorp', 'utf-8');
const apiKeyMatch = envContent.match(/GOOGLE_AI_API_KEY=(.+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : '';

console.log('🔍 Testing Gemini API Connectivity');
console.log('='.repeat(50));
console.log('API Key:', apiKey.substring(0, 20) + '...');
console.log('');

if (!apiKey) {
  console.error('❌ No API key found!');
  process.exit(1);
}

try {
  console.log('1️⃣ Initializing Gemini client...');
  const genAI = new GoogleGenAI({ apiKey });
  console.log('✅ Client initialized');
  console.log('');
  
  console.log('2️⃣ Testing simple text generation...');
  const startTime = Date.now();
  
  const result = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'Say hello in Spanish',
  });
  
  const duration = Date.now() - startTime;
  const text = result.text || '';
  
  console.log('✅ Request successful!');
  console.log('Duration:', duration + 'ms');
  console.log('Response:', text);
  console.log('');
  console.log('✅ Gemini API is working correctly!');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('');
  console.error('Error details:', error);
  console.error('');
  console.error('Possible causes:');
  console.error('- Network connectivity issue');
  console.error('- Firewall blocking googleapis.com');
  console.error('- API key invalid or restricted');
  console.error('- IPv6 vs IPv4 routing issue');
  console.error('- Node.js fetch configuration');
  
  process.exit(1);
}

