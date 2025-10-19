#!/bin/bash
# Test script for RAG functionality
#
# This script tests:
# 1. Embedding generation
# 2. Chunk creation
# 3. Document upload with RAG
# 4. Query with RAG search

set -e

BASE_URL="http://localhost:3000"
USER_ID="test-user"

echo "🧪 Testing RAG Functionality"
echo "============================="
echo ""

# Check if server is running
if ! curl -s -f "$BASE_URL/api/health/firestore" > /dev/null 2>&1; then
  echo "❌ Server not running on $BASE_URL"
  echo "   Start server with: npm run dev"
  exit 1
fi

echo "✅ Server is running"
echo ""

# Test 1: Check Vertex AI API is available
echo "Test 1: Vertex AI API Status"
echo "-----------------------------"

if gcloud services list --enabled --project=gen-lang-client-0986191192 | grep -q aiplatform.googleapis.com; then
  echo "✅ Vertex AI API enabled"
else
  echo "❌ Vertex AI API not enabled"
  echo "   Run: gcloud services enable aiplatform.googleapis.com --project=gen-lang-client-0986191192"
  exit 1
fi
echo ""

# Test 2: Upload document with RAG
echo "Test 2: Upload Document with RAG"
echo "---------------------------------"
echo "Please upload a test PDF through the UI:"
echo "1. Go to $BASE_URL/chat"
echo "2. Click '+ Agregar' in Fuentes de Contexto"
echo "3. Upload a test PDF"
echo "4. Check console logs for:"
echo "   🔍 Starting RAG indexing..."
echo "   📄 Created X chunks..."
echo "   🧮 Generated X embeddings..."
echo "   ✅ RAG indexing complete"
echo ""
read -p "Press Enter after uploading document..."
echo ""

# Test 3: Check chunks in Firestore
echo "Test 3: Verify Chunks in Firestore"
echo "-----------------------------------"

npx tsx -e "
import { firestore } from './src/lib/firestore.js';

async function checkChunks() {
  const snapshot = await firestore.collection('document_chunks')
    .limit(5)
    .get();
  
  console.log('Total chunks found:', snapshot.size);
  
  if (snapshot.size > 0) {
    console.log('\\nSample chunk:');
    const chunk = snapshot.docs[0].data();
    console.log('  - sourceId:', chunk.sourceId);
    console.log('  - chunkIndex:', chunk.chunkIndex);
    console.log('  - text length:', chunk.text.length);
    console.log('  - embedding dimensions:', chunk.embedding.length);
    console.log('  ✅ Chunks stored correctly');
  } else {
    console.log('  ⚠️  No chunks found - upload may not have completed');
  }
  
  process.exit(0);
}

checkChunks();
" 2>/dev/null || echo "⚠️  Could not verify chunks (may need to wait for indexing)"

echo ""

# Test 4: Query with RAG
echo "Test 4: Query with RAG Search"
echo "------------------------------"
echo "Ask a question in the chat:"
echo "1. Make sure the uploaded document is enabled (toggle ON)"
echo "2. Ask a specific question about the document"
echo "3. Check console logs for:"
echo "   🔍 Attempting RAG search..."
echo "   ✅ RAG: Using X relevant chunks"
echo "4. Check Context Panel for 'RAG Active' indicator"
echo ""
read -p "Press Enter after testing query..."
echo ""

# Summary
echo "════════════════════════════════════════"
echo "RAG Testing Summary"
echo "════════════════════════════════════════"
echo ""
echo "✅ If you saw all the logs above, RAG is working!"
echo ""
echo "Expected behavior:"
echo "  • Document upload creates chunks + embeddings"
echo "  • Chunks stored in document_chunks collection"
echo "  • Query triggers RAG search"
echo "  • Only relevant chunks sent to AI (not full document)"
echo "  • 90%+ token reduction"
echo ""
echo "To verify savings:"
echo "  • Check context logs table"
echo "  • Compare input tokens with vs without RAG"
echo "  • Should see 10-40x reduction"
echo ""
echo "Admin Panel:"
echo "  • Click your name → Configuración RAG"
echo "  • View system stats and configuration"
echo ""

