import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generatePickupToken, generateOrderPickupQR } from '@/lib/qr-code';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: orderId } = params;

    // Find the order and verify ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        orderItems: {
          include: {
            bundle: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user owns this order or is admin
    if (order.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if order is ready for pickup
    if (order.orderStatus !== 'READY') {
      return NextResponse.json(
        { error: 'Order is not ready for pickup yet' },
        { status: 400 }
      );
    }

    // Check if already picked up
    if (order.pickupStatus === 'PICKED_UP') {
      return NextResponse.json(
        { error: 'Order has already been picked up' },
        { status: 400 }
      );
    }

    // Generate token if not exists
    let token = order.pickupVerificationToken;
    if (!token) {
      token = generatePickupToken();
      
      // Update order with verification token
      await prisma.order.update({
        where: { id: orderId },
        data: { pickupVerificationToken: token },
      });
    }

    // Generate QR code
    const qrData = await generateOrderPickupQR(orderId, token);

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      token: qrData.token,
      verificationUrl: qrData.url,
      qrCodeDataUrl: qrData.qrCodeDataUrl,
    });

  } catch (error) {
    console.error('Error generating pickup QR code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
