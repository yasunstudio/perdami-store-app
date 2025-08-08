// Static bank data untuk fallback ketika database bermasalah
export const STATIC_BANKS = [
  {
    id: 'bank-bri-perdami',
    name: 'Bank BRI - Perdami Store',
    code: 'BRI',
    accountNumber: '1234567890123456',
    accountName: 'Dharma Wanita Perdami',
    logo: '/images/banks/bri-logo.png',
    isActive: true,
    createdAt: new Date('2025-08-08'),
    updatedAt: new Date('2025-08-08')
  },
  {
    id: 'bank-bca-perdami',
    name: 'Bank BCA - Perdami Store', 
    code: 'BCA',
    accountNumber: '9876543210987654',
    accountName: 'Dharma Wanita Perdami',
    logo: '/images/banks/bca-logo.png',
    isActive: true,
    createdAt: new Date('2025-08-08'),
    updatedAt: new Date('2025-08-08')
  },
  {
    id: 'bank-mandiri-perdami',
    name: 'Bank Mandiri - Perdami Store',
    code: 'MANDIRI', 
    accountNumber: '5556667778889999',
    accountName: 'Dharma Wanita Perdami',
    logo: '/images/banks/mandiri-logo.png',
    isActive: true,
    createdAt: new Date('2025-08-08'),
    updatedAt: new Date('2025-08-08')
  },
  {
    id: 'bank-bni-perdami',
    name: 'Bank BNI - Perdami Store',
    code: 'BNI',
    accountNumber: '1112223334445555', 
    accountName: 'Dharma Wanita Perdami',
    logo: '/images/banks/bni-logo.png',
    isActive: false,
    createdAt: new Date('2025-08-08'),
    updatedAt: new Date('2025-08-08')
  }
];

export const STATIC_APP_SETTINGS = {
  id: 'static-settings',
  appName: 'Perdami Store',
  appDescription: 'Platform pre-order oleh-oleh khas Bandung untuk peserta PIT PERDAMI 2025',
  singleBankMode: false, // Multiple banks enabled
  defaultBankId: null,
  isActive: true,
  createdAt: new Date('2025-08-08'),
  updatedAt: new Date('2025-08-08')
};
