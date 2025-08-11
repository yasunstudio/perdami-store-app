import { PrismaClient } from '@prisma/client';
import { generatePickupToken } from '../src/lib/qr-code';

const prisma = new PrismaClient();

async function updateExistingReadyOrders() {
  console.log('🔄 Updating existing READY orders with pickup verification tokens...');
  
  try {
    // Find all READY orders without pickup verification token
    const readyOrders = await prisma.order.findMany({
      where: {
        orderStatus: 'READY',
        pickupVerificationToken: null
      },
      select: {
        id: true,
        orderNumber: true,
      }
    });

    console.log(`📦 Found ${readyOrders.length} READY orders without pickup verification tokens`);

    if (readyOrders.length === 0) {
      console.log('✅ No orders to update');
      return;
    }

    // Update each order with a verification token
    const updatePromises = readyOrders.map(async (order) => {
      const token = generatePickupToken();
      await prisma.order.update({
        where: { id: order.id },
        data: { pickupVerificationToken: token }
      });
      console.log(`✅ Updated order ${order.orderNumber} with token: ${token.substring(0, 8)}...`);
    });

    await Promise.all(updatePromises);
    
    console.log(`🎉 Successfully updated ${readyOrders.length} orders with pickup verification tokens`);
    
  } catch (error) {
    console.error('❌ Error updating orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingReadyOrders();
