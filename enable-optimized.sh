#!/bin/bash

# ⚡ Quick script to enable optimized streaming endpoint
# Run: ./enable-optimized.sh

echo "⚡ Enabling Optimized Streaming Endpoint"
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found"
  echo "   Create it from .env.example first"
  exit 1
fi

# Check if flag already set
if grep -q "PUBLIC_USE_OPTIMIZED_STREAMING" .env; then
  echo "✅ Flag already exists in .env"
  echo "   Current value:"
  grep "PUBLIC_USE_OPTIMIZED_STREAMING" .env
  echo ""
  read -p "   Update to 'true'? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Update existing line
    sed -i '' 's/PUBLIC_USE_OPTIMIZED_STREAMING=.*/PUBLIC_USE_OPTIMIZED_STREAMING=true/' .env
    echo "✅ Flag updated to 'true'"
  else
    echo "⏭️  Skipping update"
  fi
else
  # Add new line
  echo "" >> .env
  echo "# ⚡ PERFORMANCE: Use optimized streaming endpoint (5x faster)" >> .env
  echo "PUBLIC_USE_OPTIMIZED_STREAMING=true" >> .env
  echo "✅ Flag added to .env"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Next steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Restart server:"
echo "   pkill -f \"astro dev\" && npm run dev"
echo ""
echo "2. Test in browser:"
echo "   http://localhost:3000/chat"
echo ""
echo "3. Expected performance:"
echo "   ~6 seconds (vs ~30s before) ⚡⚡⚡"
echo ""
echo "4. Verify with DevTools:"
echo "   F12 → Performance tab → Record"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📖 Documentation:"
echo "   - ENABLE_OPTIMIZED_STREAMING.md (quick start)"
echo "   - FRONTEND_OPTIMIZATION_COMPLETE.md (overview)"
echo "   - OPTIMIZATION_ARCHITECTURE.md (deep dive)"
echo ""
echo "🔧 To disable:"
echo "   Change PUBLIC_USE_OPTIMIZED_STREAMING=false in .env"
echo ""

