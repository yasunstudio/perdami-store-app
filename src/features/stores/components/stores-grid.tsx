import { StoreCard } from './store-card'
import { type StoreWithCounts } from '@/types'

interface StoresGridProps {
  stores: StoreWithCounts[]
  isLoading?: boolean
}

export function StoresGrid({ stores, isLoading = false }: StoresGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6 animate-pulse">
            <div className="aspect-square bg-muted rounded-lg mb-4" />
            <div className="space-y-2">
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stores.map((store) => (
        <StoreCard key={store.id} store={store} />
      ))}
    </div>
  )
}
