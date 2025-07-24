// Virtual scrolling table component for better performance with large datasets
'use client'

import { useVirtualList } from '@/hooks/use-performance'
import { memo, useMemo } from 'react'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface VirtualTableProps<T> {
  data: T[]
  rowHeight: number
  containerHeight: number
  renderRow: (item: T, index: number) => React.ReactNode
  headers: React.ReactNode
  className?: string
  overscan?: number
}

function VirtualTableInner<T>({
  data,
  rowHeight,
  containerHeight,
  renderRow,
  headers,
  className,
  overscan = 5,
}: VirtualTableProps<T>) {
  const {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  } = useVirtualList({
    items: data,
    itemHeight: rowHeight,
    containerHeight,
    overscan,
  })

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  return (
    <div
      className={className}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          {headers}
        </TableHeader>
        <TableBody>
          <tr style={{ height: totalHeight }}>
            <td colSpan={100} style={{ padding: 0, border: 0 }}>
              <div
                style={{
                  transform: `translateY(${offsetY}px)`,
                  position: 'relative',
                }}
              >
                {visibleItems.map(({ item, index }) => 
                  renderRow(item, index)
                )}
              </div>
            </td>
          </tr>
        </TableBody>
      </Table>
    </div>
  )
}

export const VirtualTable = memo(VirtualTableInner) as typeof VirtualTableInner
