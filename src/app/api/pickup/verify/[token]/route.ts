import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isValidPickupToken } from '@/lib/qr-code';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Validate token format
    if (!isValidPickupToken(token)) {
      return NextResponse.json(
        { error: 'Invalid verification token format' },
        { status: 400 }
      );
    }

    // Find order by verification token
    const order = await prisma.order.findUnique({
      where: { pickupVerificationToken: token },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
        orderItems: {
          include: {
            bundle: {
              select: { id: true, name: true, image: true }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 404 }
      );
    }

    // Check if already picked up
    if (order.pickupStatus === 'PICKED_UP') {
      return NextResponse.json(
        { error: 'Order has already been picked up' },
        { status: 400 }
      );
    }

    // Return order details for verification
    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customer: {
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone,
      },
      orderItems: order.orderItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        bundle: item.bundle,
      })),
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      pickupStatus: order.pickupStatus,
      createdAt: order.createdAt,
    });

  } catch (error) {
    console.error('Error verifying pickup token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { token } = params;

    // Validate token format
    if (!isValidPickupToken(token)) {
      return NextResponse.json(
        { error: 'Invalid verification token format' },
        { status: 400 }
      );
    }

    // Find and update order
    const order = await prisma.order.findUnique({
      where: { pickupVerificationToken: token },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 404 }
      );
    }

    // Check if already picked up
    if (order.pickupStatus === 'PICKED_UP') {
      return NextResponse.json(
        { error: 'Order has already been picked up' },
        { status: 400 }
      );
    }

    // Update pickup status
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        pickupStatus: 'PICKED_UP',
        orderStatus: 'COMPLETED',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Order pickup confirmed successfully',
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      customer: {
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone,
      },
      pickedUpAt: updatedOrder.updatedAt,
    });

  } catch (error) {
    console.error('Error confirming pickup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
