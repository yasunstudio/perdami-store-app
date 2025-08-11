export const ordersData = [
  {
    userIndex: 1, // Dr. Sari Wijayanti
    status: "COMPLETED",
    paymentStatus: "PAID",
    paymentMethod: "BANK_TRANSFER",
    totalAmount: 2500000,
    serviceFee: 25000,
    pickupDate: new Date('2024-08-15'),
    customerNotes: "Mohon disiapkan untuk acara pernikahan tanggal 20 Agustus",
    bundles: [
      { bundleIndex: 0, quantity: 1 } // Wedding Tech Complete Package
    ],
    daysAgo: 15
  },
  {
    userIndex: 2, // Prof. Budi Santoso  
    status: "PROCESSING",
    paymentStatus: "PAID",
    paymentMethod: "BANK_TRANSFER", 
    totalAmount: 1800000,
    serviceFee: 18000,
    pickupDate: new Date('2024-08-25'),
    customerNotes: "Untuk seminar nasional, mohon pastikan semua perangkat berfungsi dengan baik",
    bundles: [
      { bundleIndex: 1, quantity: 1 } // Conference & Seminar Tech Bundle
    ],
    daysAgo: 8
  },
  {
    userIndex: 3, // Dr. Maya Kusuma
    status: "PENDING", 
    paymentStatus: "PENDING",
    paymentMethod: "BANK_TRANSFER",
    totalAmount: 3500000,
    serviceFee: 35000,
    pickupDate: new Date('2024-09-01'),
    customerNotes: "Wedding package untuk acara di Jakarta, mohon konfirmasi ketersediaan",
    bundles: [
      { bundleIndex: 5, quantity: 1 } // Executive Wedding Attire Package
    ],
    daysAgo: 3
  },
  {
    userIndex: 4, // Agus Prasetyo
    status: "COMPLETED",
    paymentStatus: "PAID", 
    paymentMethod: "BANK_TRANSFER",
    totalAmount: 5000000,
    serviceFee: 50000,
    pickupDate: new Date('2024-08-10'),
    customerNotes: "Catering untuk 100 tamu, mohon pastikan kualitas makanan terjaga",
    bundles: [
      { bundleIndex: 10, quantity: 1 } // Wedding Catering Deluxe Package
    ],
    daysAgo: 20
  },
  {
    userIndex: 2, // Prof. Budi Santoso (order kedua)
    status: "CANCELLED",
    paymentStatus: "REFUNDED",
    paymentMethod: "BANK_TRANSFER",
    totalAmount: 1200000,
    serviceFee: 12000,
    pickupDate: null,
    customerNotes: "Pembatalan karena perubahan jadwal acara",
    bundles: [
      { bundleIndex: 11, quantity: 1 } // Conference Coffee Break Package
    ],
    daysAgo: 12
  },
  {
    userIndex: 1, // Dr. Sari Wijayanti (order kedua)
    status: "PROCESSING",
    paymentStatus: "PAID",
    paymentMethod: "BANK_TRANSFER",
    totalAmount: 800000,
    serviceFee: 8000, 
    pickupDate: new Date('2024-08-30'),
    customerNotes: "Untuk acara keluarga, mohon dikemas dengan rapi",
    bundles: [
      { bundleIndex: 12, quantity: 1 } // Family Gathering Food Package
    ],
    daysAgo: 5
  }
]
