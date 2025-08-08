#!/bin/bash

echo "🧪 TESTING ALL APIS WITH COMPREHENSIVE DATA"
echo "=============================================="

BASE_URL="https://dharma-wanita-perdami.vercel.app/api"

# Function to test API endpoint
test_api() {
  local endpoint=$1
  local description=$2
  
  echo ""
  echo "📡 Testing: $description"
  echo "URL: $BASE_URL/$endpoint"
  echo "----------------------------------------"
  
  response=$(curl -s "$BASE_URL/$endpoint")
  
  # Check different response formats
  if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    # Format: {success: true, data: []}
    echo "Success: $(echo "$response" | jq -r '.success')"
    echo "Count: $(echo "$response" | jq '.data | length?' 2>/dev/null || echo "0")"
  elif echo "$response" | jq -e '.banks' > /dev/null 2>&1; then
    # Banks API format: {banks: []}
    echo "Banks count: $(echo "$response" | jq '.banks | length')"
  elif echo "$response" | jq -e '.bundles' > /dev/null 2>&1; then
    # Bundles API format: {bundles: []}
    echo "Bundles count: $(echo "$response" | jq '.bundles | length')"
  elif echo "$response" | jq -e '.users' > /dev/null 2>&1; then
    # Users API format: {users: []}
    echo "Users count: $(echo "$response" | jq '.users | length')"
  elif echo "$response" | jq -e '.orders' > /dev/null 2>&1; then
    # Orders API format: {orders: []}
    echo "Orders count: $(echo "$response" | jq '.orders | length')"
  elif echo "$response" | jq -e '.notifications' > /dev/null 2>&1; then
    # Notifications API format: {notifications: []}
    echo "Notifications count: $(echo "$response" | jq '.notifications | length')"
  elif echo "$response" | jq -e '.' > /dev/null 2>&1; then
    # Array format: []
    echo "Array count: $(echo "$response" | jq '. | length')"
  else
    # HTML or error response
    if [[ "$response" == *"<html"* ]]; then
      echo "❌ HTML response (404 or error)"
    else
      echo "Response: $response"
    fi
  fi
}

# Test all main APIs
test_api "banks" "Banks API"
test_api "bundles" "Product Bundles API" 
test_api "stores" "Stores API"
test_api "users" "Users API"
test_api "orders" "Orders API"
test_api "contact-info" "Contact Info API"
test_api "quick-actions" "Quick Actions API"
test_api "notifications" "Notifications API"

echo ""
echo "🎯 DETAILED STORES API DATA:"
echo "============================="
curl -s "$BASE_URL/stores" | jq '.data[] | {id, name, bundleCount}'

echo ""
echo "🎯 DETAILED BUNDLES API DATA:"
echo "============================="
curl -s "$BASE_URL/bundles" | jq '.bundles[] | {id, name, price, storeId}'

echo ""
echo "✅ API TESTING COMPLETE!"
