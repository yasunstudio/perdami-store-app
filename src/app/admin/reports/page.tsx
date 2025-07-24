import { Metadata } from 'next'
import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { AdvancedAnalytics } from '@/features/admin/analytics/components/advanced-analytics'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Laporan & Analisis | Admin Perdami Store',
  description: 'Lihat laporan penjualan dan analisis bisnis',
}

export default function ReportsAdminPage() {
  const actions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="h-8">
        <RefreshCw className="h-4 w-4 mr-1" />
        Refresh
      </Button>
      <Button size="sm" className="h-8">
        <Download className="h-4 w-4 mr-1" />
        Export
      </Button>
    </div>
  )

  return (
    <AdminPageLayout 
      title="Laporan & Analisis" 
      description="Analisis performa penjualan dan insight bisnis"
      actions={actions}
    >
      <AdvancedAnalytics />
    </AdminPageLayout>
  )
}
