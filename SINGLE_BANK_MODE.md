# Single Bank Mode Implementation

## Overview
Single Bank Mode adalah fitur yang memungkinkan aplikasi untuk hanya menampilkan satu bank untuk transfer, cocok untuk event singkat dimana admin ingin menyederhanakan proses checkout dengan mengurangi pilihan bank yang tersedia.

## Features Implemented

### 1. Database Schema (✅ Completed)
- **AppSettings Model**: Added `singleBankMode` and `defaultBankId` fields
- **Bank Model**: Added `appSettings` relation
- **Migration**: `20250802173442_add_single_bank_mode`

### 2. Backend Services (✅ Completed)

#### SingleBankService (`src/lib/single-bank.ts`)
- `isSingleBankModeEnabled()`: Check if single bank mode is active
- `getDefaultBank()`: Get the default bank for single bank mode
- `getAvailableBanks()`: Get banks based on mode (1 bank in single mode, all banks in normal mode)
- `toggleSingleBankMode()`: Enable/disable single bank mode
- `setDefaultBank()`: Set which bank to use as default
- `getConfiguration()`: Get complete single bank configuration

#### API Endpoints
- **GET /api/banks**: Modified to return banks based on single bank mode setting
  - Returns only default bank when single bank mode is enabled
  - Returns all active banks when single bank mode is disabled
  - Includes `singleBankMode` flag in response

### 3. Frontend Implementation (✅ Completed)

#### Checkout Form (`src/features/checkout/components/checkout-form.tsx`)
- **Single Bank Mode**: Shows bank info directly without selection dropdown
- **Multiple Bank Mode**: Shows traditional bank selection dropdown
- **Auto-selection**: Automatically selects the default bank when single bank mode is enabled

#### Admin Settings (`src/components/admin/settings-container.tsx`)
- **New Payment Tab**: Added dedicated tab for payment settings
- **Single Bank Toggle**: Switch to enable/disable single bank mode
- **Default Bank Selection**: Radio buttons to select which bank to use as default
- **Visual Indicators**: Shows selected bank with visual feedback
- **Info Panel**: Explains benefits and behavior of single bank mode

### 4. Scripts and Tools (✅ Completed)

#### Setup Script (`scripts/setup-single-bank-mode.ts`)
- Automatically enables single bank mode
- Sets the first active bank as default
- Shows configuration summary

#### Test Scripts
- `scripts/test-single-bank-mode.ts`: Test configuration status
- `scripts/test-toggle-single-bank.ts`: Test toggle functionality

## How It Works

### Single Bank Mode Enabled
1. **Checkout**: Customers see bank transfer details directly without selection
2. **API Response**: Only returns the default bank
3. **Admin**: Can still manage all banks, but only default bank is public

### Single Bank Mode Disabled (Default behavior)
1. **Checkout**: Customers can choose from all active banks
2. **API Response**: Returns all active banks
3. **Admin**: Traditional multi-bank management

## Configuration

### Enable Single Bank Mode
```typescript
await SingleBankService.toggleSingleBankMode(true, bankId)
```

### Set Default Bank
```typescript
await SingleBankService.setDefaultBank(bankId)
```

### Check Current Status
```typescript
const isEnabled = await SingleBankService.isSingleBankModeEnabled()
const defaultBank = await SingleBankService.getDefaultBank()
```

## Usage Scenarios

### Short Events (Single Bank Mode)
- **Use Case**: PIT PERDAMI 2025 dengan satu rekening event
- **Benefits**: 
  - Faster checkout process
  - Less confusion for customers
  - Simplified bank management
  - Direct bank info display

### Regular Operations (Multiple Bank Mode)
- **Use Case**: Ongoing store with multiple payment options
- **Benefits**:
  - Customer choice flexibility
  - Load distribution across banks
  - Backup payment options

## Admin Interface

### Settings Page (`/admin/settings`)
1. Navigate to **Pembayaran** tab
2. Toggle **"Aktifkan Mode Bank Tunggal"**
3. Select default bank from available options
4. Save settings

### Visual Indicators
- ✅ Selected bank has blue border and check mark
- 🔴 Inactive banks show "Nonaktif" badge
- 💡 Info panel explains single bank mode benefits

## API Response Examples

### Single Bank Mode Enabled
```json
{
  "banks": [
    {
      "id": "bank1",
      "name": "Bank Central Asia (BCA)",
      "code": "BCA",
      "accountNumber": "1234567890",
      "accountName": "Perdami Store"
    }
  ],
  "singleBankMode": true
}
```

### Single Bank Mode Disabled
```json
{
  "banks": [
    {
      "id": "bank1",
      "name": "Bank Central Asia (BCA)",
      "code": "BCA"
    },
    {
      "id": "bank2", 
      "name": "Bank Mandiri",
      "code": "MANDIRI"
    }
  ],
  "singleBankMode": false
}
```

## Testing

### Automated Tests
```bash
# Test current configuration
npx tsx scripts/test-single-bank-mode.ts

# Test toggle functionality  
npx tsx scripts/test-toggle-single-bank.ts

# Test API endpoint
curl http://localhost:3000/api/banks
```

### Manual Testing
1. **Admin Settings**: Test toggle and bank selection
2. **Checkout Page**: Verify bank display based on mode
3. **API Endpoint**: Check response format and content

## Implementation Status: ✅ COMPLETE

All components of the single bank mode implementation have been successfully completed:

- ✅ Database schema and migrations
- ✅ Backend services and API endpoints  
- ✅ Frontend checkout form modifications
- ✅ Admin interface for configuration
- ✅ Testing scripts and validation
- ✅ Documentation and usage examples

The system is now ready for use in both single bank mode (for short events) and multiple bank mode (for regular operations).
