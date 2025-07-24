'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BundleCard } from '@/components/shared/bundle-card'
import { ProductBundle } from '@/types'
import { Search, Filter } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface BundlesResponse {
  bundles: (ProductBundle & {
    store: {
      id: string
      name: string
    }
  })[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function BundlesPageView() {
  const [bundles, setBundles] = useState<BundlesResponse['bundles']>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<BundlesResponse['pagination'] | null>(null)

  const fetchBundles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sort: sortBy,
      })

      console.log('Fetching bundles with params:', params.toString())

      const response = await fetch(`/api/bundles?${params}`)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Bundle fetch error:', response.status, errorText)
        throw new Error(`Failed to fetch bundles: ${response.status}`)
      }

      const data: BundlesResponse = await response.json()
      console.log('Bundles fetched successfully:', {
        count: data.bundles.length,
        total: data.pagination.total,
        bundles: data.bundles.map(b => ({
          id: b.id,
          name: b.name,
          price: b.price,
          contents: b.contents,
          store: b.store
        }))
      })
      
      setBundles(data.bundles)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching bundles:', error)
      toast.error('Gagal memuat paket produk')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBundles()
  }, [currentPage, sortBy])

  const filteredBundles = bundles.filter(bundle =>
    bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bundle.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Paket Produk
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Hemat lebih banyak dengan paket produk pilihan kami
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <Input
                placeholder="Cari paket produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Terbaru</SelectItem>
                <SelectItem value="price-low">Harga Terendah</SelectItem>
                <SelectItem value="price-high">Harga Tertinggi</SelectItem>
                <SelectItem value="name">Nama A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Info */}
          {pagination && (
            <div className="flex items-center justify-between">
              <p className="text-gray-600 dark:text-gray-400">
                Menampilkan {filteredBundles.length} dari {pagination.total} paket produk
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted aspect-square rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="bg-muted h-4 rounded"></div>
                    <div className="bg-muted h-4 rounded w-2/3"></div>
                    <div className="bg-muted h-6 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bundle Grid */}
          {!loading && filteredBundles.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBundles.map((bundle) => (
                  <BundleCard key={bundle.id} bundle={bundle} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    Sebelumnya
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(pagination.pages - 4, currentPage - 2)) + i
                      if (pageNum > pagination.pages) return null
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= pagination.pages}
                  >
                    Selanjutnya
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!loading && filteredBundles.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-600 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Tidak ada paket produk ditemukan
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Coba ubah kata kunci pencarian atau filter yang dipilih
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setSortBy('newest')
                  setCurrentPage(1)
                }}
              >
                Reset Filter
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
