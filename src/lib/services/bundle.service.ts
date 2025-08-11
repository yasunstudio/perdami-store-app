import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// Define bundle contents structure - simplified
export interface BundleContentItem {
  name: string
  quantity: number
}

// Define types for bundle in bundle-only approach - direct to store
export type BundleWithDetails = Prisma.ProductBundleGetPayload<{
  include: {
    store: {
      select: {
        id: true
        name: true
        description: true
      }
    }
  }
}>

export class BundleService {
  /**
   * Get bundle by ID - Bundle-only approach with direct store relation
   */
  static async getById(id: string): Promise<BundleWithDetails | null> {
    try {
      const bundle = await prisma.productBundle.findUnique({
        where: { 
          id,
          isActive: true 
        },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      })

      return bundle
    } catch (error) {
      console.error('BundleService.getById error:', error)
      throw new Error('Failed to fetch bundle')
    }
  }

  /**
   * Get all active bundles with pagination - Bundle-only approach
   */
  static async getAll(options?: {
    featured?: boolean
    limit?: number
    page?: number
    search?: string
    sort?: 'newest' | 'oldest' | 'price_low' | 'price_high'
  }) {
    try {
      const {
        featured,
        limit = 10,
        page = 1,
        search,
        sort = 'newest'
      } = options || {}

      const skip = (page - 1) * limit

      const where: any = {
        isActive: true,
        showToCustomer: true
      }

      if (featured) {
        where.isFeatured = true
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }

      const orderBy = this.getSortOrder(sort)

      const [bundles, total] = await Promise.all([
        prisma.productBundle.findMany({
          where,
          include: {
            store: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          },
          orderBy,
          skip,
          take: limit
        }),
        prisma.productBundle.count({ where })
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        bundles,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    } catch (error) {
      console.error('BundleService.getAll error:', error)
      throw new Error('Failed to fetch bundles')
    }
  }

  /**
   * Get featured bundles for homepage
   */
  static async getFeatured(limit: number = 6) {
    return this.getAll({ featured: true, limit })
  }

  /**
   * Create new bundle - Bundle-only approach
   */
  static async create(data: {
    name: string
    description?: string
    image?: string
    price: number
    contents?: BundleContentItem[]
    storeId: string
    isActive?: boolean
    isFeatured?: boolean
    showToCustomer?: boolean
  }) {
    try {
      const bundle = await prisma.productBundle.create({
        data: {
          name: data.name,
          description: data.description,
          image: data.image,
          price: data.price,
          contents: data.contents ? data.contents as any : undefined,
          storeId: data.storeId,
          isActive: data.isActive ?? true,
          isFeatured: data.isFeatured ?? false,
          showToCustomer: data.showToCustomer ?? false
        },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      })

      return bundle
    } catch (error) {
      console.error('BundleService.create error:', error)
      throw new Error('Failed to create bundle')
    }
  }

  /**
   * Update bundle - Bundle-only approach
   */
  static async update(id: string, data: {
    name?: string
    description?: string
    image?: string
    price?: number
    contents?: BundleContentItem[]
    storeId?: string
    isActive?: boolean
    isFeatured?: boolean
    showToCustomer?: boolean
  }): Promise<BundleWithDetails | null> {
    try {
      const updateData: any = { ...data }
      if (data.contents) {
        updateData.contents = data.contents as any
      }

      const bundle = await prisma.productBundle.update({
        where: { id },
        data: updateData,
        include: {
          store: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      })

      return bundle
    } catch (error) {
      console.error('BundleService.update error:', error)
      throw new Error('Failed to update bundle')
    }
  }

  private static getSortOrder(sort: string) {
    switch (sort) {
      case 'oldest':
        return { createdAt: 'asc' as const }
      case 'price_low':
        return { price: 'asc' as const }
      case 'price_high':
        return { price: 'desc' as const }
      case 'newest':
      default:
        return { createdAt: 'desc' as const }
    }
  }
}
