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
          <div key={i} className="h-80 bg-muted rounded-lg animate-pulse" />
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
