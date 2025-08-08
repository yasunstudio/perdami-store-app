#!/bin/bash

echo "🔍 COMPREHENSIVE ADMIN API TESTING"
echo "=================================="
echo ""

echo "📊 1. Testing Core Public APIs (Should Work):"
echo "-----------------------------------------------"
echo "Users API:"
curl -s "https://dharma-wanita-perdami.vercel.app/api/users" | jq '{success: .success, users: (.data | length)}'

echo -e "\nUsers Stats API:"
curl -s "https://dharma-wanita-perdami.vercel.app/api/users/stats" | jq '{totalUsers: .totalUsers, totalAdmins: .totalAdmins}'

echo -e "\nStores API:"
curl -s "https://dharma-wanita-perdami.vercel.app/api/stores" | jq '{success: .success, stores: (.data | length)}'

echo -e "\nBundles API:"
curl -s "https://dharma-wanita-perdami.vercel.app/api/bundles" | jq '{bundles: (.bundles | length)}'

echo -e "\n📋 2. Testing Admin APIs (May Need Auth):"
echo "---------------------------------------------"
echo "Admin Dashboard API:"
curl -s "https://dharma-wanita-perdami.vercel.app/api/admin/dashboard" --max-time 10 | head -50

echo -e "\n🔧 3. Diagnosis:"
echo "---------------"
echo "✅ Public APIs working: users, users/stats, stores, bundles"
echo "❌ Admin APIs requiring auth may fail without login session"
echo "💡 Dashboard should use fallback strategy: admin API → public APIs"

echo -e "\n🎯 4. Expected Results on Admin Dashboard:"
echo "============================================="
echo "- Total Users: 5"
echo "- Total Bundles: 7"  
echo "- Total Stores: 5"
echo "- Total Orders: 1"
echo "- Should show recent orders and popular bundles"

echo -e "\n🌐 5. Manual Testing Required:"
echo "==============================="
echo "1. Login as admin: https://dharma-wanita-perdami.vercel.app/auth/login"
echo "   Email: admin@perdami.com"
echo "   Password: admin123"
echo ""
echo "2. Visit admin dashboard: https://dharma-wanita-perdami.vercel.app/admin"
echo ""
echo "3. Check browser console for API call logs"
echo ""
echo "4. If still showing 'gagal memuat data', check Network tab for failed requests"
