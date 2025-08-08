#!/bin/bash

echo "🚀 Testing Vercel Dashboard APIs..."
echo "📅 $(date)"
echo "🌐 Base URL: https://dharma-wanita-perdami.vercel.app"
echo ""

echo "🔍 Testing Public Dashboard API..."
curl -s -X GET "https://dharma-wanita-perdami.vercel.app/api/dashboard-public" \
     -H "Content-Type: application/json" \
     | python3 -m json.tool 2>/dev/null || echo "❌ Public Dashboard API failed"

echo ""
echo "🔍 Testing Admin Dashboard API (without auth)..."
curl -s -X GET "https://dharma-wanita-perdami.vercel.app/api/admin/dashboard" \
     -H "Content-Type: application/json" \
     | python3 -m json.tool 2>/dev/null || echo "❌ Admin Dashboard API failed"

echo ""
echo "🔍 Testing Basic API Health..."
curl -s -X GET "https://dharma-wanita-perdami.vercel.app/api/health" \
     -H "Content-Type: application/json" \
     | python3 -m json.tool 2>/dev/null || echo "❌ Health API not found"

echo ""
echo "✅ API tests completed"
