import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/admin/products/stats called')
    
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get total products count
    const totalProducts = await prisma.productBundle.count()
    console.log(`Total products: ${totalProducts}`)
    
    // Get active products count
    const activeProducts = await prisma.productBundle.count({
      where: {
        isActive: true
      }
    })
    console.log(`Active products: ${activeProducts}`)
    
    // Get top selling products with order data
    const topSellingProducts = await prisma.productBundle.findMany({
      include: {
        store: {
          select: {
            name: true
          }
        },
        orderItems: {
          include: {
            order: {
              select: {
                orderStatus: true,
                totalAmount: true
              }
            }
          }
        }
      },
      where: {
        isActive: true
      }
    })
    
    // Calculate sales stats for each product
    const productsWithStats = topSellingProducts
      .map(product => {
        const completedOrders = product.orderItems.filter(
          item => item.order?.orderStatus === 'COMPLETED'
        )
        
        const totalOrders = new Set(
          product.orderItems.map(item => item.orderId)
        ).size
        
        const totalRevenue = completedOrders.reduce(
          (sum, item) => sum + item.totalPrice, 0
        )
        
        const totalQuantity = product.orderItems.reduce(
          (sum, item) => sum + item.quantity, 0
        )
        
        return {
          id: product.id,
          name: product.name,
          price: product.sellingPrice,
          storeName: product.store?.name || 'Unknown Store',
          totalOrders,
          totalRevenue,
          totalQuantity,
          isFeatured: product.isFeatured
        }
      })
      .filter(product => product.totalOrders > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10) // Top 10 products
    
    console.log('Top selling products:', productsWithStats)
    
    const stats = {
      totalProducts,
      activeProducts,
      topSellingProducts: productsWithStats,
      featuredProducts: topSellingProducts.filter(p => p.isFeatured).length
    }
    
    console.log('Returning product stats:', stats)
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in GET /api/admin/products/stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product statistics' },
      { status: 500 }
    )
  }
}
