#!/bin/bash

echo "🧪 Testing APIs with new seeded data..."
echo "========================================="

BASE_URL="https://dharma-wanita-perdami.vercel.app/api"

echo ""
echo "1️⃣ Banks API:"
curl -s "$BASE_URL/banks" | jq -r '.banks | length' | awk '{print "   Banks count: " $1}'

echo ""
echo "2️⃣ Stores API:"
curl -s "$BASE_URL/stores" | jq -r '.data | length // .total // "API error"' | awk '{print "   Stores count: " $1}'

echo ""
echo "3️⃣ Bundles API:"
curl -s "$BASE_URL/bundles" | jq -r '.bundles | length' | awk '{print "   Bundles count: " $1}'

echo ""
echo "4️⃣ Users API (if exists):"
curl -s "$BASE_URL/users" | jq -r '.data | length // "API not available"' | awk '{print "   Response: " $1}'

echo ""
echo "5️⃣ Orders API (if exists):"
curl -s "$BASE_URL/orders" | jq -r '.data | length // "API not available"' | awk '{print "   Response: " $1}'

echo ""
echo "6️⃣ Contact API (if exists):"
curl -s "$BASE_URL/contact" | jq -r '.data | length // "API not available"' | awk '{print "   Response: " $1}'

echo ""
echo "7️⃣ Settings API (if exists):"
curl -s "$BASE_URL/settings" | jq -r '.data.appName // "API not available"' | awk '{print "   App name: " $0}'

echo ""
echo "✅ API testing completed!"
