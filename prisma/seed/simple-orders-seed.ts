import { PrismaClient, OrderStatus, PaymentStatus, PaymentMethod, PickupMethod } from '@prisma/client';

// Inisialisasi Prisma Client
const prisma = new PrismaClient();

// Fungsi bantuan untuk menghasilkan nomor order
function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${dateStr}-${randomDigits}`;
}

async function seedOrdersAndPayments() {
  try {
    console.log('🌱 Memulai seeding data Order dan Payment sederhana...');

    // 1. Ambil customer pertama
    const customer = await prisma.user.findFirst({
      where: { role: 'CUSTOMER' }
    });

    if (!customer) {
      console.error('❌ Tidak ada user customer untuk membuat order');
      return;
    }

    // 2. Ambil bank pertama (atau null)
    const bank = await prisma.bank.findFirst();
    
    // 3. Ambil bundle pertama
    const bundle = await prisma.productBundle.findFirst({
      where: { isActive: true }
    });

    if (!bundle) {
      console.error('❌ Tidak ada bundle untuk membuat order');
      return;
    }

    // Array status order untuk dibuat
    const orderStatuses: OrderStatus[] = [
      OrderStatus.PENDING, 
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.READY,
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED
    ];

    // Buat order untuk setiap status
    for (const status of orderStatuses) {
      const quantity = Math.floor(Math.random() * 3) + 1; // Random quantity 1-3
      const price = bundle.price;
      const totalAmount = price * quantity;
      
      // Tentukan status pembayaran berdasarkan status order
      let paymentStatus: PaymentStatus;
      if (status === OrderStatus.PENDING) {
        paymentStatus = PaymentStatus.PENDING;
      } else if (status === OrderStatus.CANCELLED) {
        paymentStatus = PaymentStatus.FAILED;
      } else {
        paymentStatus = PaymentStatus.PAID;
      }

      // Buat order dengan orderItems
      const orderData: any = {
        orderNumber: generateOrderNumber(),
        userId: customer.id,
        totalAmount,
        orderStatus: status,
        pickupMethod: PickupMethod.VENUE,
        notes: `Contoh order dengan status ${status}`,
        orderItems: {
          create: [{
            bundleId: bundle.id,
            quantity,
            price
          }]
        }
      };
      
      // Tambahkan bankId jika ada
      if (bank) {
        orderData.bankId = bank.id;
      }

      const order = await prisma.order.create({
        data: orderData
      });
      
      // Buat payment untuk order ini
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          method: PaymentMethod.BANK_TRANSFER,
          status: paymentStatus,
          proofUrl: paymentStatus === PaymentStatus.PAID ? '/images/payment-proof-example.jpg' : null,
          notes: `Pembayaran untuk order ${order.orderNumber}`
        }
      });
      
      console.log(`✅ Order #${order.orderNumber} dengan status ${status} berhasil dibuat`);
    }
    
    console.log('🎉 Seeding data Order dan Payment selesai!');
  } catch (error) {
    console.error('❌ Error saat seeding data Order dan Payment:', error);
  }
}

// Eksekusi seeding
seedOrdersAndPayments()
  .catch((e) => {
    console.error('❌ Error dalam proses seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
