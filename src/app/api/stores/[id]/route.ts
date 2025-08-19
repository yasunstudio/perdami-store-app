import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Create fresh prisma client for serverless environment to avoid prepared statement conflicts
    
    try {
      const { id } = await params

      const store = await prisma.store.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              bundles: true
            }
          },
          bundles: {
            where: {
              isActive: true,
              showToCustomer: true
            },
            include: {
              store: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      })

      if (!store) {
        return NextResponse.json(
          { error: 'Store tidak ditemukan' },
          { status: 404 }
        )
      }

      // Filter bundles that are active and for customer
      const activeBundles = store.bundles.filter((bundle: any) => 
        bundle.isActive && bundle.showToCustomer
      )

      // Transform the response
      const transformedStore = {
        id: store.id,
        name: store.name,
        description: store.description,
        image: store.image,
        isActive: store.isActive,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt,
        bundles: activeBundles.map((bundle: any) => ({
          id: bundle.id,
          name: bundle.name,
          description: bundle.description,
          image: bundle.image,
          price: bundle.sellingPrice, // Map sellingPrice to price for frontend
          costPrice: bundle.costPrice,
          sellingPrice: bundle.sellingPrice,
          contents: bundle.contents,
          isActive: bundle.isActive,
          isFeatured: bundle.isFeatured,
          showToCustomer: bundle.showToCustomer,
          storeId: bundle.storeId,
          createdAt: bundle.createdAt,
          updatedAt: bundle.updatedAt,
          store: bundle.store
        })),
        bundleCount: store._count.bundles,
        activeBundleCount: activeBundles.length,
        featuredBundleCount: activeBundles.filter((b: any) => b.isFeatured).length
      }

      return NextResponse.json(transformedStore)
    } finally {
      // Clean up prisma client
    }

  } catch (error) {
    console.error('Error fetching store:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data store' },
      { status: 500 }
    )
  }
}
