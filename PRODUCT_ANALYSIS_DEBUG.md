# Product Analysis Debug Guide

## Issue: "Paket Bebek Frozen 3 Pack 900000" vs "3x450000"

### Possible Root Causes:

1. **Bundle ID Duplication**
   - Same product might have multiple bundle IDs
   - Different stores selling same product with different IDs
   
2. **Price Inconsistency**
   - Product sold at different unit prices in different transactions
   - Bulk pricing vs individual pricing
   
3. **Aggregation Logic Error**
   - Wrong calculation of average unit price
   - Incorrect revenue/quantity division

### Debug Steps Added:

1. **Console Logging**: Added debug logs for "Bebek Frozen" products
2. **Average Price Calculation**: Changed from static unitPrice to calculated avgUnitPrice
3. **Transaction Tracking**: Track total transactions per product

### To Verify:

1. Check browser console for "Bebek Frozen Debug" logs when accessing profit-loss report
2. Look for:
   - Multiple bundle IDs for same product name
   - Different unit prices for same product
   - Quantity vs totalPrice consistency

### Expected Behavior:

For "Paket Bebek Frozen 3 Pack":
- If sold 3 times at 450,000 each
- Total revenue should be: 1,350,000
- Total quantity should be: 3
- Average unit price should be: 450,000
- NOT: 900,000 as single transaction

### Action Plan:

1. Run report and check console logs
2. Identify if there are duplicate bundle IDs
3. Check if product naming is consistent
4. Verify quantity and pricing calculations
5. Fix aggregation logic if needed
