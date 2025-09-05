'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Settings, RefreshCw } from 'lucide-react'
import { useMaintenanceStatus } from '@/hooks/use-maintenance-status'
import Link from 'next/link'

export function MaintenanceBanner() {
  const { status, loading, refetch } = useMaintenanceStatus()

  // Don't show banner if not in maintenance mode
  if (!status?.isMaintenanceMode || loading) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-4 border-orange-200 bg-orange-50 dark:bg-orange-900/30">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <p className="font-medium text-orange-800 dark:text-orange-200">
            🔧 Mode Maintenance Aktif
          </p>
          <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
            Aplikasi saat ini dalam mode maintenance. User tidak dapat mengakses area shopping.
          </p>
          {status.message && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 italic">
              Pesan: "{status.message.slice(0, 100)}..."
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button 
            size="sm" 
            variant="outline"
            onClick={refetch}
            className="h-8 border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <Link href="/admin/settings">
            <Button 
              size="sm"
              className="h-8 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  )
}
