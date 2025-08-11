export const bundlesData = [
  // Electronics Store Bundles
  {
    storeIndex: 0, // Toko Elektronik
    bundles: [
      {
        name: "Wedding Tech Complete Package",
        description: "Paket lengkap teknologi untuk acara pernikahan. Termasuk sound system profesional, wireless microphone, proyektor HD, laptop, dan lighting LED.",
        price: 2500000,
        image: "/images/bundles/wedding-tech-package.jpg",
        contents: [
          { item: "Sound System Profesional", quantity: 1, price: 800000 },
          { item: "Wireless Microphone Set", quantity: 2, price: 400000 },
          { item: "Proyektor HD", quantity: 1, price: 600000 },
          { item: "Laptop untuk Presentasi", quantity: 1, price: 500000 },
          { item: "LED Lighting Set", quantity: 1, price: 200000 }
        ],
        isActive: true,
        isFeatured: true,
        showToCustomer: true
      },
      {
        name: "Conference & Seminar Tech Bundle",
        description: "Solusi teknologi lengkap untuk konferensi dan seminar. Dilengkapi dengan sistem audio visual berkualitas tinggi dan perangkat pendukung presentasi.",
        price: 1800000,
        image: "/images/bundles/conference-tech-bundle.jpg",
        contents: [
          { item: "Sound System Conference", quantity: 1, price: 600000 },
          { item: "Microphone Wireless", quantity: 3, price: 450000 },
          { item: "Proyektor Business", quantity: 1, price: 500000 },
          { item: "Screen Proyektor", quantity: 1, price: 250000 }
        ],
        isActive: true,
        isFeatured: true,
        showToCustomer: true
      },
      {
        name: "Training Workshop Tech Kit",
        description: "Paket peralatan teknologi untuk workshop dan pelatihan. Mendukung pembelajaran interaktif dengan teknologi terkini.",
        price: 1200000,
        image: "/images/bundles/workshop-tech-kit.jpg",
        contents: [
          { item: "Portable Speaker", quantity: 2, price: 400000 },
          { item: "Tablet untuk Instruktur", quantity: 2, price: 600000 },
          { item: "Extension Cable Set", quantity: 1, price: 100000 },
          { item: "Power Bank High Capacity", quantity: 3, price: 100000 }
        ],
        isActive: true,
        isFeatured: false,
        showToCustomer: true
      },
      {
        name: "Meeting Room Setup Package",
        description: "Perlengkapan teknologi untuk ruang meeting modern. Cocok untuk rapat formal maupun informal dengan kualitas audio visual terbaik.",
        price: 900000,
        image: "/images/bundles/meeting-setup-package.jpg",
        contents: [
          { item: "Webcam HD untuk Video Call", quantity: 1, price: 200000 },
          { item: "Bluetooth Speaker", quantity: 1, price: 300000 },
          { item: "Wireless Presentation Remote", quantity: 1, price: 150000 },
          { item: "Cable Management Set", quantity: 1, price: 250000 }
        ],
        isActive: true,
        isFeatured: false,
        showToCustomer: true
      },
      {
        name: "Photography & Documentation Package",
        description: "Paket lengkap untuk dokumentasi acara. Termasuk kamera profesional, tripod, dan peralatan fotografi lainnya.",
        price: 2200000,
        image: "/images/bundles/photography-package.jpg",
        contents: [
          { item: "DSLR Camera Kit", quantity: 1, price: 1200000 },
          { item: "Professional Tripod", quantity: 2, price: 400000 },
          { item: "External Flash", quantity: 2, price: 300000 },
          { item: "Memory Card High Speed", quantity: 4, price: 300000 }
        ],
        isActive: true,
        isFeatured: true,
        showToCustomer: true
      }
    ]
  },
  
  // Fashion & Lifestyle Store Bundles
  {
    storeIndex: 1, // Toko Fashion & Lifestyle
    bundles: [
      {
        name: "Executive Wedding Attire Package",
        description: "Paket busana eksklusif untuk pengantin dan keluarga. Terdiri dari outfit formal berkelas tinggi dengan aksesoris premium.",
        price: 3500000,
        image: "/images/bundles/executive-wedding-attire.jpg",
        contents: [
          { item: "Jas Pengantin Pria Premium", quantity: 1, price: 1200000 },
          { item: "Gaun Pengantin Wanita Eksklusif", quantity: 1, price: 1800000 },
          { item: "Sepatu Formal Premium", quantity: 2, price: 400000 },
          { item: "Aksesoris Set Lengkap", quantity: 1, price: 100000 }
        ],
        isActive: true,
        isFeatured: true,
        showToCustomer: true
      },
      {
        name: "Conference Professional Look",
        description: "Tampilan profesional untuk acara konferensi dan business meeting. Outfit formal yang memberikan kesan confident dan authoritative.",
        price: 1500000,
        image: "/images/bundles/conference-professional-look.jpg",
        contents: [
          { item: "Blazer Business Professional", quantity: 1, price: 600000 },
          { item: "Kemeja Formal Premium", quantity: 2, price: 400000 },
          { item: "Celana Formal", quantity: 2, price: 300000 },
          { item: "Dasi dan Aksesoris", quantity: 1, price: 200000 }
        ],
        isActive: true,
        isFeatured: true,
        showToCustomer: true
      },
      {
        name: "Casual Weekend Lifestyle Bundle",
        description: "Koleksi pakaian casual untuk acara santai dan kegiatan weekend. Nyaman dipakai dengan style yang tetap fashionable.",
        price: 800000,
        image: "/images/bundles/casual-weekend-bundle.jpg",
        contents: [
          { item: "Polo Shirt Premium", quantity: 3, price: 450000 },
          { item: "Chino Pants", quantity: 2, price: 250000 },
          { item: "Sneakers Casual", quantity: 1, price: 100000 }
        ],
        isActive: true,
        isFeatured: false,
        showToCustomer: true
      },
      {
        name: "Formal Event Accessories Set",
        description: "Koleksi aksesoris lengkap untuk acara formal. Menambah kesan elegan dan sophisticated pada penampilan Anda.",
        price: 600000,
        image: "/images/bundles/formal-accessories-set.jpg",
        contents: [
          { item: "Jam Tangan Formal", quantity: 1, price: 250000 },
          { item: "Dompet Kulit Premium", quantity: 1, price: 150000 },
          { item: "Ikat Pinggang Kulit", quantity: 1, price: 100000 },
          { item: "Manset dan Pin", quantity: 1, price: 100000 }
        ],
        isActive: true,
        isFeatured: false,
        showToCustomer: true
      },
      {
        name: "PERDAMI Merchandise Complete Set",
        description: "Koleksi lengkap merchandise resmi PIT PERDAMI 2025. Cocok untuk kenang-kenangan atau souvenir acara.",
        price: 400000,
        image: "/images/bundles/perdami-merchandise-set.jpg",
        contents: [
          { item: "T-Shirt PERDAMI Official", quantity: 2, price: 150000 },
          { item: "Tote Bag PERDAMI", quantity: 1, price: 75000 },
          { item: "Tumbler PERDAMI", quantity: 1, price: 100000 },
          { item: "Pin dan Sticker Set", quantity: 1, price: 75000 }
        ],
        isActive: true,
        isFeatured: true,
        showToCustomer: true
      }
    ]
  },
  
  // Culinary Store Bundles
  {
    storeIndex: 2, // Toko Kuliner
    bundles: [
      {
        name: "Wedding Catering Deluxe Package",
        description: "Paket katering mewah untuk acara pernikahan. Menu lengkap dengan hidangan premium yang menggugah selera untuk 100 tamu.",
        price: 5000000,
        image: "/images/bundles/wedding-catering-deluxe.jpg",
        contents: [
          { item: "Main Course Premium (100 porsi)", quantity: 1, price: 2000000 },
          { item: "Appetizer Selection (100 porsi)", quantity: 1, price: 800000 },
          { item: "Dessert Wedding Cake", quantity: 1, price: 1200000 },
          { item: "Welcome Drink (100 gelas)", quantity: 1, price: 500000 },
          { item: "Table Setting & Service", quantity: 1, price: 500000 }
        ],
        isActive: true,
        isFeatured: true,
        showToCustomer: true
      },
      {
        name: "Conference Coffee Break Package",
        description: "Paket coffee break untuk acara konferensi dan seminar. Menyediakan energi dan refreshment untuk peserta sepanjang acara.",
        price: 1200000,
        image: "/images/bundles/conference-coffee-break.jpg",
        contents: [
          { item: "Coffee & Tea Station (50 porsi)", quantity: 1, price: 400000 },
          { item: "Snack Box Premium (50 box)", quantity: 1, price: 500000 },
          { item: "Fresh Fruit Platter", quantity: 2, price: 200000 },
          { item: "Mini Sandwich Selection", quantity: 50, price: 100000 }
        ],
        isActive: true,
        isFeatured: true,
        showToCustomer: true
      },
      {
        name: "Family Gathering Food Package",
        description: "Paket makanan untuk acara kumpul keluarga yang hangat. Menu home-style yang lezat dan cocok untuk segala usia.",
        price: 800000,
        image: "/images/bundles/family-gathering-food.jpg",
        contents: [
          { item: "Nasi Gudeg Jogja (20 porsi)", quantity: 1, price: 300000 },
          { item: "Ayam Goreng Kremes (20 porsi)", quantity: 1, price: 250000 },
          { item: "Sayur Lodeh (20 porsi)", quantity: 1, price: 150000 },
          { item: "Es Teh Manis (20 gelas)", quantity: 1, price: 100000 }
        ],
        isActive: true,
        isFeatured: false,
        showToCustomer: true
      },
      {
        name: "Executive Lunch Meeting Package",
        description: "Menu lunch eksklusif untuk meeting eksekutif. Hidangan berkelas dengan presentasi premium untuk kesan profesional.",
        price: 1500000,
        image: "/images/bundles/executive-lunch-meeting.jpg",
        contents: [
          { item: "Beef Tenderloin (10 porsi)", quantity: 1, price: 700000 },
          { item: "Grilled Salmon (10 porsi)", quantity: 1, price: 500000 },
          { item: "Caesar Salad (10 porsi)", quantity: 1, price: 200000 },
          { item: "Fruit Infused Water (10 botol)", quantity: 1, price: 100000 }
        ],
        isActive: true,
        isFeatured: true,
        showToCustomer: true
      },
      {
        name: "Traditional Snack Box Collection",
        description: "Koleksi snack box berisi jajanan tradisional Indonesia. Cocok untuk acara informal dan sebagai oleh-oleh.",
        price: 300000,
        image: "/images/bundles/traditional-snack-collection.jpg",
        contents: [
          { item: "Klepon (30 pieces)", quantity: 1, price: 75000 },
          { item: "Lemper Ayam (30 pieces)", quantity: 1, price: 100000 },
          { item: "Kue Lapis (30 pieces)", quantity: 1, price: 75000 },
          { item: "Teh Botol (30 botol)", quantity: 1, price: 50000 }
        ],
        isActive: true,
        isFeatured: false,
        showToCustomer: true
      }
    ]
  }
]
