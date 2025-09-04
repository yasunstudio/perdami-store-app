# Order ke Toko - Analytics Feature

## 📋 Overview
Fitur analytics untuk mengelola laporan pesanan berdasarkan batch dan toko, dirancang khusus untuk event Fit Perdami 2025.

## 🚀 Accessing the Feature
1. Login ke admin dashboard
2. Navigate ke **Analytics & Reports** → **Order ke Toko**
3. URL: `/admin/analytics/order-to-stores`

## ⚡ Quick Start
1. **Pilih Quick Template**: Gunakan template yang sudah disediakan untuk laporan umum
2. **Select Toko**: Pilih toko yang ingin dianalisis (multi-select available)
3. **Select Batch**: Pilih batch waktu (Batch 1: 06:00-18:00, Batch 2: 18:00-06:00)
4. **Set Date Range**: Tentukan rentang waktu laporan
5. **Generate Preview**: Lihat preview laporan sebelum export
6. **Export**: Pilih format export yang diinginkan

## 🎯 Key Features

### Batch System (12-Hour Split)
- **Batch 1 (Siang)**: 06:00 - 18:00 (Cut-off: 15:00)
- **Batch 2 (Malam)**: 18:00 - 06:00 (Cut-off: 03:00)

### Store Selection
- Multi-select dengan search functionality
- Real-time order count dan total value
- Select All/Clear All options
- Visual selection dengan badges

### Report Preview
- Summary statistics (total orders, revenue, stores)
- Top performing stores ranking
- Top products analysis
- Peak hours analysis
- Batch performance breakdown

### Export Options
- **Summary Report**: Overview dalam satu sheet
- **Detailed Report**: Breakdown per toko dengan sheet terpisah
- **Packing List**: Format untuk persiapan barang
- **Mobile Friendly**: Format sederhana untuk mobile viewing
- **WhatsApp Format**: Text format siap broadcast

### Quick Templates
- **Daily Batch 1**: Laporan harian batch siang
- **Daily Batch 2**: Laporan harian batch malam
- **All Stores Today**: Semua toko hari ini
- **Packing Lists**: Daftar packing untuk persiapan
- **WhatsApp Broadcast**: Format untuk grup broadcast

## 📊 Data Structure

### API Endpoints
- `GET /api/admin/analytics/order-to-stores/stores` - Get store list with metrics
- `GET /api/admin/analytics/order-to-stores/batches` - Get batch configuration
- `POST /api/admin/analytics/order-to-stores/preview` - Generate report preview
- `POST /api/admin/analytics/order-to-stores/export` - Export report

### Report Data Includes
- Order summaries per store
- Product performance analysis
- Time-based analytics
- Customer information
- Financial metrics (revenue, average order value)

## 🔧 Technical Implementation

### Component Structure
```
src/features/admin/analytics/
├── components/order-to-stores/
│   ├── order-to-stores-main.tsx     # Main container
│   ├── store-selector.tsx           # Multi-select store picker
│   ├── batch-selector.tsx           # Batch time selection
│   ├── date-range-picker.tsx        # Date range with presets
│   ├── report-preview.tsx           # Statistics preview
│   ├── export-options.tsx           # Export format selection
│   └── quick-templates.tsx          # Pre-configured templates
├── hooks/
│   └── use-order-to-stores.ts       # Main business logic hook
├── types/                           # TypeScript definitions
├── constants/                       # Configuration constants
└── utils/                          # Helper functions
```

### State Management
- React hooks untuk local state
- Real-time data fetching
- Error handling dan loading states
- Export progress tracking

## 🎨 UI/UX Features
- Dark/Light mode support
- Responsive design (mobile-friendly)
- Loading skeletons
- Error states dengan retry functionality
- Progress indicators for exports
- Hover effects dan smooth transitions

## 🚀 Future Enhancements
- Real Excel file generation
- WhatsApp Bot integration
- Email notifications
- Scheduled reports
- Advanced filtering options
- Custom template builder
- Dashboard widgets integration

## 📱 Mobile Experience
- Responsive grid layouts
- Touch-friendly interactions
- Mobile-optimized export formats
- Swipe gestures support

## 🔐 Permissions
Requires `REPORTS_READ` permission untuk akses fitur ini.

## 📞 Support
Untuk pertanyaan atau issues, hubungi tim development.
