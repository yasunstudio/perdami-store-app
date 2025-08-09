#!/bin/bash

echo "🔍 Testing Admin APIs on Vercel..."
echo "📅 $(date)"
echo "🌐 Base URL: https://dharma-wanita-perdami.vercel.app"
echo ""

# Test public APIs first
echo "✅ Testing Public APIs:"
echo "🔍 Testing Dashboard Public..."
curl -s -X GET "https://dharma-wanita-perdami.vercel.app/api/dashboard-public" | head -c 100
echo "... (truncated)"
echo ""

echo "🔍 Testing Health API..."
curl -s -X GET "https://dharma-wanita-perdami.vercel.app/api/health" | python3 -m json.tool | head -5
echo ""

# Test admin APIs (without auth - should return 401)
echo "❌ Testing Admin APIs (without auth - should return 401):"

echo "🔍 Testing Admin Dashboard..."
curl -s -X GET "https://dharma-wanita-perdami.vercel.app/api/admin/dashboard" \
     -H "Content-Type: application/json" \
     | python3 -m json.tool 2>/dev/null | head -10

echo ""
echo "🔍 Testing Admin Orders..."
curl -s -X GET "https://dharma-wanita-perdami.vercel.app/api/admin/orders" \
     -H "Content-Type: application/json" \
     | python3 -m json.tool 2>/dev/null | head -10

echo ""
echo "🔍 Testing Admin Bundles..."
curl -s -X GET "https://dharma-wanita-perdami.vercel.app/api/admin/bundles" \
     -H "Content-Type: application/json" \
     | python3 -m json.tool 2>/dev/null | head -10

echo ""
echo "🔍 Testing Admin Stores..."
curl -s -X GET "https://dharma-wanita-perdami.vercel.app/api/admin/stores" \
     -H "Content-Type: application/json" \
     | python3 -m json.tool 2>/dev/null | head -10

echo ""
echo "🔍 Testing Admin Banks..."
curl -s -X GET "https://dharma-wanita-perdami.vercel.app/api/admin/banks" \
     -H "Content-Type: application/json" \
     | python3 -m json.tool 2>/dev/null | head -10

echo ""
echo "✅ Admin API tests completed"
