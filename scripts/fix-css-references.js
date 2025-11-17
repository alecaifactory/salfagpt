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

// Find all page files in server/pages
const pagesDir = path.join(serverDir, 'pages');
const pageFiles = [];

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.mjs')) {
      pageFiles.push(filePath);
    }
  }
}

if (fs.existsSync(pagesDir)) {
  walkDir(pagesDir);
}

// Scan all page files for CSS references
const cssReferencesFound = new Set();

for (const pageFile of pageFiles) {
  const content = fs.readFileSync(pageFile, 'utf8');
  const matches = content.match(/href=\\"\/([^"\\]+\.css)\\"/g) || [];
  
  for (const match of matches) {
    const cssFile = match.match(/href=\\"\/([^"\\]+\.css)\\"/)[1];
    cssReferencesFound.add(cssFile);
  }
}

console.log('🔍 CSS references found:', Array.from(cssReferencesFound));

// Create missing CSS files
for (const cssFile of cssReferencesFound) {
  const targetPath = path.join(clientDir, cssFile);
  
  if (!fs.existsSync(targetPath)) {
    console.log('✅ Creating missing CSS:', cssFile);
    fs.writeFileSync(targetPath, cssContent);
  } else {
    console.log('ℹ️  Already exists:', cssFile);
  }
}

console.log('✅ CSS references fixed');

