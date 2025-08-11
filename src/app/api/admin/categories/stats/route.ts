import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Since we don't have categories model in the schema,
    // we'll create categories based on store types as a workaround
    const stores = await prisma.store.findMany({
      include: {
        _count: {
          select: {
            bundles: {
              where: { isActive: true }
            }
          }
        }
      }
    })

    // Create pseudo categories based on store names and descriptions
    const categoryMapping: { [key: string]: string[] } = {
      'Elektronik': ['Elektronik', 'Electronic', 'gadget', 'komputer'],
      'Fashion': ['Fashion', 'Pakaian', 'Baju', 'Celana'],
      'Makanan': ['Makanan', 'Food', 'Kuliner', 'Oleh-oleh', 'Keripik', 'Dodol', 'Batagor', 'Surabi'],
      'Olahraga': ['Sport', 'Olahraga', 'Gym', 'Fitness'],
      'Kecantikan': ['Beauty', 'Kosmetik', 'Kecantikan']
    }

    const categoryStats = Object.keys(categoryMapping).map(categoryName => {
      const keywords = categoryMapping[categoryName]
      const matchingStores = stores.filter(store => 
        keywords.some(keyword => 
          store.name.toLowerCase().includes(keyword.toLowerCase()) ||
          (store.description && store.description.toLowerCase().includes(keyword.toLowerCase()))
        )
      )

      const totalProducts = matchingStores.reduce((sum, store) => sum + store._count.bundles, 0)
      
      return {
        name: categoryName,
        _count: {
          products: totalProducts
        },
        stores: matchingStores.length
      }
    })

    // Add "Lainnya" category for stores that don't match any category
    const categorizedStoreIds = new Set()
    Object.keys(categoryMapping).forEach(categoryName => {
      const keywords = categoryMapping[categoryName]
      stores.forEach(store => {
        if (keywords.some(keyword => 
          store.name.toLowerCase().includes(keyword.toLowerCase()) ||
          (store.description && store.description.toLowerCase().includes(keyword.toLowerCase()))
        )) {
          categorizedStoreIds.add(store.id)
        }
      })
    })

    const uncategorizedStores = stores.filter(store => !categorizedStoreIds.has(store.id))
    const uncategorizedProducts = uncategorizedStores.reduce((sum, store) => sum + store._count.bundles, 0)

    if (uncategorizedStores.length > 0) {
      categoryStats.push({
        name: 'Lainnya',
        _count: {
          products: uncategorizedProducts
        },
        stores: uncategorizedStores.length
      })
    }

    // Sort by product count
    const topCategories = categoryStats
      .filter(cat => cat._count.products > 0)
      .sort((a, b) => b._count.products - a._count.products)

    return NextResponse.json({
      stats: {
        totalCategories: topCategories.length,
        activeCategories: topCategories.length,
        categoryGrowthRate: 5.2 // Placeholder since we don't have historical data
      },
      topCategories,
      categoryStats: topCategories,
      chartData: topCategories.slice(0, 5).map(cat => ({
        name: cat.name,
        count: cat._count.products,
        stores: cat.stores
      }))
    })

  } catch (error) {
    console.error('Categories stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
