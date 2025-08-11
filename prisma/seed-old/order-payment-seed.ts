import { PrismaClient, OrderStatus, PaymentStatus, PaymentMethod, PickupMethod } from '@prisma/client'
import { formatISO } from 'date-fns';

// Inisialisasi Prisma Client
const prisma = new PrismaClient()

// Fungsi bantuan untuk menghasilkan nomor order
function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD-${dateStr}-${randomDigits}`
}

// Fungsi untuk membuat tanggal dalam rentang tertentu
function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

async function seedOrdersAndPayments() {
  try {
    console.log('🌱 Memulai seeding data Order dan Payment...')

    // Ambil data yang diperlukan dari database
    const users = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
      },
      take: 5
    })

    if (users.length === 0) {
      console.warn('⚠️ Tidak ada user dengan role CUSTOMER, tidak bisa membuat order')
      return
    }

    const bundles = await prisma.productBundle.findMany({
      where: {
        isActive: true,
      },
      include: {
        store: true
      }
    })

    if (bundles.length === 0) {
      console.warn('⚠️ Tidak ada bundle aktif, tidak bisa membuat order')
      return
    }

    const banks = await prisma.bank.findMany({
      where: {
        isActive: true,
      }
    })

    if (banks.length === 0) {
      console.warn('⚠️ Tidak ada bank aktif, akan membuat order tanpa bank')
    }

    // Buat beberapa order dengan status yang berbeda
    const orderData = []
    
    // Order 1: PENDING - Dengan payment status PENDING
    orderData.push({
      user: users[0],
      bank: banks.length > 0 ? banks[0] : null,
      orderStatus: 'PENDING',
      paymentStatus: 'PENDING',
      createdAt: randomDate(new Date('2025-07-01'), new Date('2025-07-10')),
      bundles: [
        { bundle: bundles[0], quantity: 2 },
        { bundle: bundles[1], quantity: 1 }
      ]
    })

    // Order 2: CONFIRMED - Dengan payment status PAID
    orderData.push({
      user: users[1],
      bank: banks.length > 0 ? banks[0] : null,
      orderStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      createdAt: randomDate(new Date('2025-07-05'), new Date('2025-07-12')),
      bundles: [
        { bundle: bundles[1], quantity: 3 }
      ]
    })

    // Order 3: PROCESSING - Dengan payment status PAID
    orderData.push({
      user: users[2],
      bank: banks.length > 0 ? banks[0] : null,
      orderStatus: 'PROCESSING',
      paymentStatus: 'PAID',
      createdAt: randomDate(new Date('2025-07-08'), new Date('2025-07-15')),
      bundles: [
        { bundle: bundles[0], quantity: 1 },
        { bundle: bundles[2] ? bundles[2] : bundles[0], quantity: 1 }
      ]
    })

    // Order 4: READY - Dengan payment status PAID
    orderData.push({
      user: users[0],
      bank: banks.length > 0 ? banks[0] : null,
      orderStatus: 'READY',
      paymentStatus: 'PAID',
      createdAt: randomDate(new Date('2025-07-10'), new Date('2025-07-18')),
      bundles: [
        { bundle: bundles[2] ? bundles[2] : bundles[0], quantity: 2 }
      ]
    })

    // Order 5: COMPLETED - Dengan payment status PAID
    orderData.push({
      user: users[3] ? users[3] : users[0],
      bank: banks.length > 0 ? banks[0] : null,
      orderStatus: 'COMPLETED',
      paymentStatus: 'PAID',
      createdAt: randomDate(new Date('2025-07-01'), new Date('2025-07-05')),
      bundles: [
        { bundle: bundles[0], quantity: 1 },
        { bundle: bundles[1], quantity: 1 },
        { bundle: bundles[2] ? bundles[2] : bundles[0], quantity: 1 }
      ]
    })

    // Order 6: CANCELLED - Dengan payment status FAILED
    orderData.push({
      user: users[4] ? users[4] : users[0],
      bank: banks.length > 0 ? banks[0] : null,
      orderStatus: 'CANCELLED',
      paymentStatus: 'FAILED',
      createdAt: randomDate(new Date('2025-07-12'), new Date('2025-07-20')),
      bundles: [
        { bundle: bundles[1], quantity: 2 }
      ]
    })

    // Seeding data order dan payment
    console.log(`⏳ Membuat ${orderData.length} order beserta payment...`)
    
    for (const orderItem of orderData) {
      // Hitung total amount dari bundle
      let totalAmount = 0
      const orderItems = []

      for (const item of orderItem.bundles) {
        const subtotal = item.bundle.price * item.quantity
        totalAmount += subtotal
        
        orderItems.push({
          bundleId: item.bundle.id,
          quantity: item.quantity,
          price: item.bundle.price
        })
      }

      // Buat order
      const orderCreateData: any = {
          orderNumber: generateOrderNumber(),
          userId: orderItem.user.id,
          totalAmount: totalAmount,
          orderStatus: orderItem.orderStatus as OrderStatus,
          pickupMethod: PickupMethod.VENUE,
          notes: `Contoh order dengan status ${orderItem.orderStatus}`,
          createdAt: orderItem.createdAt,
          updatedAt: orderItem.createdAt,
          orderItems: {
            create: orderItems
          }
        };
        
      // Tambahkan bankId hanya jika ada bank
      if (orderItem.bank) {
        orderCreateData.bankId = orderItem.bank.id;
      }
      
      const order = await prisma.order.create({
        data: orderCreateData
      })

      // Buat payment
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          method: PaymentMethod.BANK_TRANSFER,
          status: orderItem.paymentStatus as PaymentStatus,
          proofUrl: orderItem.paymentStatus === 'PAID' ? `/images/payment-proofs/proof-${order.id.slice(0, 8)}.jpg` : null,
          notes: `Pembayaran untuk order ${order.orderNumber}`,
          createdAt: orderItem.createdAt,
          updatedAt: orderItem.createdAt,
        }
      })
      
      // Tambahkan notifikasi untuk user
      await prisma.inAppNotification.create({
        data: {
          userId: orderItem.user.id,
          type: 'ORDER',
          title: `Order ${order.orderNumber} telah dibuat`,
          message: `Order Anda dengan nomor ${order.orderNumber} telah dibuat dan menunggu pembayaran.`,
          data: { orderId: order.id, orderNumber: order.orderNumber },
          createdAt: orderItem.createdAt,
          updatedAt: orderItem.createdAt,
        }
      })

      // Tambahkan log aktivitas
      await prisma.userActivityLog.create({
        data: {
          userId: orderItem.user.id,
          action: 'CREATE',
          resource: 'ORDER',
          resourceId: order.id,
          details: JSON.stringify({
            orderNumber: order.orderNumber,
            totalAmount: totalAmount,
            status: orderItem.orderStatus
          }),
          createdAt: orderItem.createdAt,
        }
      })

      // Jika pembayaran sudah dilakukan, tambahkan log pembayaran
      if (orderItem.paymentStatus === 'PAID') {
        const paymentDate = new Date(orderItem.createdAt)
        paymentDate.setHours(paymentDate.getHours() + 2) // Pembayaran dilakukan 2 jam setelah order
        
        await prisma.userActivityLog.create({
          data: {
            userId: orderItem.user.id,
            action: 'PAYMENT',
            resource: 'ORDER',
            resourceId: order.id,
            details: JSON.stringify({
              orderNumber: order.orderNumber,
              amount: totalAmount,
              status: 'PAID'
            }),
            createdAt: paymentDate,
          }
        })
        
        // Tambahkan notifikasi pembayaran
        await prisma.inAppNotification.create({
          data: {
            userId: orderItem.user.id,
            type: 'PAYMENT',
            title: 'Pembayaran Berhasil',
            message: `Pembayaran untuk order ${order.orderNumber} telah dikonfirmasi.`,
            data: { orderId: order.id, orderNumber: order.orderNumber },
            createdAt: paymentDate,
            updatedAt: paymentDate,
          }
        })
      }

      console.log(`✅ Order #${order.orderNumber} dengan status ${orderItem.orderStatus} berhasil dibuat`)
    }
    
    console.log('🎉 Seeding data Order dan Payment selesai!')
  } catch (error) {
    console.error('❌ Error saat seeding data Order dan Payment:', error)
  }
}

// Eksekusi seeding
seedOrdersAndPayments()
  .catch((e) => {
    console.error('❌ Error dalam proses seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
