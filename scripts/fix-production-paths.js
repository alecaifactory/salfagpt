/**
 * Fix absolute file paths in Astro build output for Docker deployment
 * 
 * Problem: Astro bakes absolute paths like file:///Users/alec/salfagpt/dist/
 * Solution: Replace with Docker container paths file:///app/dist/
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const entryFile = join(process.cwd(), 'dist/server/entry.mjs');

console.log('🔧 Fixing production file paths in entry.mjs...');

try {
  // Read the entry file
  let content = readFileSync(entryFile, 'utf-8');
  
  // Get the current absolute path
  const localPath = process.cwd().replace(/\\/g, '/');
  console.log(`   Local path: ${localPath}`);
  
  // Replace with Docker container path
  const dockerPath = '/app';
  console.log(`   Docker path: ${dockerPath}`);
  
  // Replace all occurrences
  const originalContent = content;
  content = content.replace(new RegExp(`file://${localPath}`, 'g'), `file://${dockerPath}`);
  
  if (content !== originalContent) {
    writeFileSync(entryFile, content, 'utf-8');
    console.log('✅ Fixed file paths in entry.mjs');
    console.log(`   file://${localPath}/dist/ → file://${dockerPath}/dist/`);
  } else {
    console.log('ℹ️  No paths needed fixing');
  }
  
} catch (error) {
  console.error('❌ Failed to fix paths:', error.message);
  process.exit(1);
}

