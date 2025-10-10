#!/bin/bash

echo "🔐 OAuth Client Secret Updater"
echo ""
echo "Please paste your Client Secret from Google Cloud Console:"
echo "(It should look like: GOCSPX-xxxxxxxxxxxxxxxxxxxxx)"
echo ""
read -p "Client Secret: " SECRET

if [ -z "$SECRET" ]; then
  echo "❌ No secret provided"
  exit 1
fi

# Update .env
sed -i '' "s|GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=$SECRET|g" .env

echo ""
echo "✅ Client Secret updated in .env!"
echo ""
echo "📋 Verifying configuration:"
grep "GOOGLE_CLIENT" .env
echo ""
echo "🔄 Now restart the server:"
echo "   pkill -f astro && npm run dev"
