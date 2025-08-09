#!/bin/bash

# Data extraction script for Prisma Postgres migration
echo "=== EXTRACTING DATA FOR MIGRATION ==="

# Test working API endpoints
echo "1. Testing Health API..."
curl -s "https://dharma-wanita-perdami.vercel.app/api/health" | jq .

echo -e "\n2. Testing Debug SSL (for raw data)..."
curl -s "https://dharma-wanita-perdami.vercel.app/api/debug/ssl" | jq '.tests.userCount, .tests.queryRaw'

echo -e "\n3. Extracting user data via raw query..."
# We'll use the fact that queryRaw still works

echo -e "\n4. Extracting order data..."
curl -s "https://dharma-wanita-perdami.vercel.app/api/admin/orders-fixed" | jq '.data // []'

echo -e "\n5. Extracting bundle data..."
curl -s "https://dharma-wanita-perdami.vercel.app/api/admin/bundles-fixed" | jq '.data // []'

echo -e "\n6. Extracting user data..."
curl -s "https://dharma-wanita-perdami.vercel.app/api/admin/users-fixed" | jq '.data // []'

echo "=== DATA EXTRACTION COMPLETE ==="
