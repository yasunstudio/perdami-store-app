#!/bin/bash

echo "🔍 DEBUGGING USERS API ISSUE"
echo "============================"

echo ""
echo "1. Testing Users API directly with curl..."
curl -s "https://dharma-wanita-perdami.vercel.app/api/users" | jq '.users | length'

echo ""
echo "2. Checking if users data exists by testing other APIs..."
echo "   Banks (should work): $(curl -s "https://dharma-wanita-perdami.vercel.app/api/banks" | jq '.banks | length')"
echo "   Stores (should work): $(curl -s "https://dharma-wanita-perdami.vercel.app/api/stores" | jq '.data | length')"

echo ""
echo "3. Testing Users API with different parameters..."
echo "   Default: $(curl -s "https://dharma-wanita-perdami.vercel.app/api/users" | jq '.users | length')"
echo "   Page 1: $(curl -s "https://dharma-wanita-perdami.vercel.app/api/users?page=1" | jq '.users | length')"
echo "   Role ALL: $(curl -s "https://dharma-wanita-perdami.vercel.app/api/users?role=ALL" | jq '.users | length')"

echo ""
echo "4. Checking Users API response structure..."
curl -s "https://dharma-wanita-perdami.vercel.app/api/users" | jq '.'

echo ""
echo "✅ DEBUG COMPLETE"
