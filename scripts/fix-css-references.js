#!/usr/bin/env node
/**
 * Fix CSS References
 * 
 * Astro with cssCodeSplit:false generates a single CSS bundle but sometimes
 * references it with a different name in the HTML. This script ensures the
 * CSS file exists with the expected name.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const clientDir = path.join(__dirname, '..', 'dist', 'client');
const serverDir = path.join(__dirname, '..', 'dist', 'server');

// Find the main CSS file
const cssFiles = fs.readdirSync(clientDir).filter(f => f.endsWith('.css'));
console.log('📋 CSS files found:', cssFiles);

if (cssFiles.length === 0) {
  console.log('⚠️  No CSS files found');
  process.exit(0);
}

// Read the main CSS content
const mainCss = cssFiles.find(f => f.includes('tailwind')) || cssFiles[0];
const cssContent = fs.readFileSync(path.join(clientDir, mainCss));
console.log('📄 Main CSS:', mainCss);

// Find all manifest files
const manifestFiles = fs.readdirSync(serverDir).filter(f => f.startsWith('manifest_'));

for (const manifestFile of manifestFiles) {
  const manifestPath = path.join(serverDir, manifestFile);
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  
  // Find all CSS references in manifest
  const cssReferences = manifestContent.match(/href="\/([^"]+\.css)"/g) || [];
  
  for (const ref of cssReferences) {
    const cssFile = ref.match(/href="\/([^"]+\.css)"/)[1];
    const targetPath = path.join(clientDir, cssFile);
    
    if (!fs.existsSync(targetPath)) {
      console.log('✅ Creating missing CSS:', cssFile);
      fs.writeFileSync(targetPath, cssContent);
    }
  }
}

console.log('✅ CSS references fixed');

