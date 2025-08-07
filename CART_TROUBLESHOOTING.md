# 🛒 Cart Issues Troubleshooting Guide

## Masalah yang Dilaporkan:
1. **Daftar produk yang dipesan tidak sesuai** dengan pemesanan yang dilakukan
2. **Penjumlahan order yang salah** 
3. User melakukan **dua paket untuk masing-masing store** tapi tidak terefleksi dengan benar

## 🔧 Perbaikan yang Sudah Dilakukan:

### 1. **Immutability Fix** (`cart-store.ts`)
- Fixed mutation issues dengan proper object spreading
- Memastikan state updates tidak mengubah original objects
- Menambahkan debug logging untuk development

### 2. **Service Fee Per Store** (`service-fee.ts`)
- Updated dari flat fee ke per-store calculation 
- Rp 25.000 × jumlah toko (bukan 1x untuk seluruh order)

### 3. **Calculation Improvements**
- Enhanced subtotal calculation dengan proper error handling
- Better store filtering for service fee calculation
- Consistent recalculation across all cart operations

## 🧪 Testing Steps:

### 1. **Clear Cart & Start Fresh**
```javascript
// Di browser console:
localStorage.removeItem('cart-store')
location.reload()
```

### 2. **Test Scenario: 2 Paket dari 2 Toko Berbeda**
1. Buka halaman `/bundles`
2. Pilih 1 paket dari Toko A (misalnya 2 qty)
3. Pilih 1 paket dari Toko B (misalnya 2 qty) 
4. Check halaman `/cart`

**Expected Results:**
- 2 store groups ditampilkan
- Masing-masing store menampilkan 1 item dengan qty 2
- Ongkos kirim: Rp 50.000 (Rp 25.000 × 2 toko)
- Total: Subtotal + Rp 50.000

### 3. **Test Scenario: 2 Paket dari 1 Toko**
1. Clear cart
2. Pilih 2 paket berbeda dari 1 toko yang sama
3. Check halaman `/cart`

**Expected Results:**
- 1 store group ditampilkan
- Store menampilkan 2 items berbeda
- Ongkos kirim: Rp 25.000 (Rp 25.000 × 1 toko)
- Total: Subtotal + Rp 25.000

### 4. **Debug Console Commands**
```javascript
// Copy paste script debug-cart.js ke browser console
// Atau jalankan functions:
cartDebug.runAllChecks()          // Check semua calculations
cartDebug.checkLocalStorage()     // Check stored data
cartDebug.clearCart()             // Clear untuk testing
```

## 🔍 What to Look For:

### **Cart Display Issues:**
- [ ] Items tidak muncul setelah ditambahkan
- [ ] Quantity tidak sesuai dengan yang dipilih
- [ ] Store grouping tidak benar
- [ ] Bundle contents tidak ditampilkan

### **Calculation Issues:**
- [ ] Store subtotal tidak sesuai (price × quantity per item)
- [ ] Service fee tidak sesuai (Rp 25k × store count)  
- [ ] Total tidak sesuai (subtotal + service fee)
- [ ] Item count tidak sesuai

### **Persistence Issues:**
- [ ] Cart data hilang setelah refresh
- [ ] Duplicate items setelah add multiple times
- [ ] Inconsistent state antara UI dan localStorage

## 🚨 Red Flags to Check:
1. **Console Errors** - Check browser dev tools
2. **Network Errors** - API calls failing
3. **State Mutations** - Objects being modified directly
4. **Race Conditions** - Multiple rapid clicks causing issues

## 📞 Next Steps:
1. Test the scenarios above
2. Use debug script untuk identify specific issues
3. Check browser console untuk error messages
4. Report specific steps yang reproduce masalah

## 💡 Quick Fixes:
- **Items tidak muncul**: Clear localStorage dan coba lagi
- **Wrong calculations**: Check console untuk debug info
- **UI tidak update**: Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
