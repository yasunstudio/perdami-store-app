import { PaymentStatus, OrderStatus } from '@prisma/client';
import { prisma } from '../prisma';

export interface PaymentStatusUpdate {
  paymentId: string;
  status: PaymentStatus;
  amount?: number;
  notes?: string;
}

export class PaymentStatusService {
  static async updatePaymentStatus({
    paymentId,
    status,
    amount,
    notes
  }: PaymentStatusUpdate) {
    try {
      // Update payment record
      const payment = await prisma.payment.update({
        where: {
          id: paymentId,
        },
        data: {
          status,
          amount: amount || undefined,
          notes: notes || undefined,
          updatedAt: new Date(),
        },
        include: {
          order: {
            include: {
              orderItems: {
                include: {
                  bundle: {
                    include: {
                      store: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update order status based on payment status
      let orderStatus: OrderStatus = payment.order.orderStatus;
      
      if (status === 'PAID') {
        orderStatus = 'CONFIRMED';
      } else if (status === 'FAILED') {
        orderStatus = 'CANCELLED';
      }

      // Update order status
      await prisma.order.update({
        where: {
          id: payment.order.id,
        },
        data: {
          orderStatus: orderStatus,
          updatedAt: new Date(),
        }
      });

      return {
        success: true,
        payment,
        message: `Payment status updated to ${status}`,
      };
    } catch (error) {
      console.error('Error updating payment status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getPaymentById(id: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: {
          id,
        },
        include: {
          order: {
            include: {
              orderItems: {
                include: {
                  bundle: {
                    include: {
                      store: true
                    }
                  }
                }
              },
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          }
        }
      });

      return payment;
    } catch (error) {
      console.error('Error fetching payment:', error);
      return null;
    }
  }

  static async getPaymentsByStatus(status: PaymentStatus) {
    try {
      const payments = await prisma.payment.findMany({
        where: {
          status,
        },
        include: {
          order: {
            include: {
              orderItems: {
                include: {
                  bundle: {
                    include: {
                      store: true
                    }
                  }
                }
              },
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc',
        }
      });

      return payments;
    } catch (error) {
      console.error('Error fetching payments by status:', error);
      return [];
    }
  }

  static async processPaymentWebhook(webhookData: any) {
    try {
      // Extract payment ID and status from webhook data
      // This will depend on your payment provider's webhook structure
      const { paymentId, status, amount } = webhookData;

      if (!paymentId) {
        throw new Error('Payment ID is required');
      }

      // Map payment provider status to our PaymentStatus enum
      let paymentStatus: PaymentStatus;
      switch (status?.toLowerCase()) {
        case 'success':
        case 'completed':
        case 'paid':
          paymentStatus = 'PAID';
          break;
        case 'failed':
        case 'error':
          paymentStatus = 'FAILED';
          break;
        case 'refunded':
          paymentStatus = 'REFUNDED';
          break;
        case 'pending':
        case 'processing':
        default:
          paymentStatus = 'PENDING';
          break;
      }

      // Update payment status
      const result = await this.updatePaymentStatus({
        paymentId: paymentId,
        status: paymentStatus,
        amount,
        notes: `Updated via webhook: ${JSON.stringify(webhookData)}`,
      });

      return result;
    } catch (error) {
      console.error('Error processing payment webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
