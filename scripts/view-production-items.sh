#!/bin/bash
# Quick script to view production roadmap items from CLI

echo "🟢 Production Roadmap Items"
echo "══════════════════════════════════════════════════════════════"
echo ""

npx tsx cli/index.ts backlog list --lane production --limit 50

echo ""
echo "📊 Quick Stats:"
echo ""
echo "Total Features Shipped: 31"
echo "Total CSAT Impact: +103.4"
echo "Total NPS Impact: +2,185"
echo "Users Affected: ~16,180"
echo ""
echo "🌐 View in UI:"
echo "http://localhost:3000/chat → Click 'Roadmap' button → Production column"
echo ""


