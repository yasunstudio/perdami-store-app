'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Shield, 
  Trash2, 
  Download, 
  CheckCircle, 
  XCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface UserBulkActionsProps {
  selectedUserIds: string[]
  onActionComplete: () => void
}

export function UserBulkActions({ selectedUserIds, onActionComplete }: UserBulkActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const handleBulkRoleUpdate = async (newRole: 'ADMIN' | 'CUSTOMER') => {
    setIsLoading(true)
    setLoadingAction('role')
    
    try {
      const promises = selectedUserIds.map(userId =>
        fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, role: newRole })
        })
      )
      
      const results = await Promise.all(promises)
      const successCount = results.filter(result => result.ok).length
      
      if (successCount === selectedUserIds.length) {
        toast.success(`${successCount} user berhasil diupdate ke role ${newRole}`)
      } else {
        toast.warning(`${successCount}/${selectedUserIds.length} user berhasil diupdate`)
      }
      
      onActionComplete()
    } catch (error) {
      console.error('Error updating user roles:', error)
      toast.error('Gagal mengupdate role user')
    } finally {
      setIsLoading(false)
      setLoadingAction(null)
    }
  }

  const handleBulkDelete = async () => {
    setIsLoading(true)
    setLoadingAction('delete')
    
    try {
      const promises = selectedUserIds.map(userId =>
        fetch(`/api/users?userId=${userId}`, {
          method: 'DELETE'
        })
      )
      
      const results = await Promise.all(promises)
      const successCount = results.filter(result => result.ok).length
      
      if (successCount === selectedUserIds.length) {
        toast.success(`${successCount} user berhasil dihapus`)
      } else {
        toast.warning(`${successCount}/${selectedUserIds.length} user berhasil dihapus`)
      }
      
      onActionComplete()
    } catch (error) {
      console.error('Error deleting users:', error)
      toast.error('Gagal menghapus user')
    } finally {
      setIsLoading(false)
      setLoadingAction(null)
    }
  }

  const handleBulkExport = async () => {
    setIsLoading(true)
    setLoadingAction('export')
    
    try {
      const userIds = selectedUserIds.join(',')
      const response = await fetch(`/api/users/export?userIds=${userIds}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `users_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success('Data user berhasil diexport')
      } else {
        toast.error('Gagal mengexport data user')
      }
    } catch (error) {
      console.error('Error exporting users:', error)
      toast.error('Gagal mengexport data user')
    } finally {
      setIsLoading(false)
      setLoadingAction(null)
    }
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {selectedUserIds.length} user dipilih
              </span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
              <Users className="h-3 w-3 mr-1" />
              Bulk Actions
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Role Update */}
            <Select onValueChange={handleBulkRoleUpdate} disabled={isLoading}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Ubah Role" />
                {loadingAction === 'role' && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Jadikan Admin
                  </div>
                </SelectItem>
                <SelectItem value="CUSTOMER">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Jadikan Customer
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Export Selected */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkExport}
              disabled={isLoading}
              className="gap-2"
            >
              {loadingAction === 'export' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export
            </Button>

            {/* Delete Selected */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isLoading}
                  className="gap-2"
                >
                  {loadingAction === 'delete' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Hapus
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Konfirmasi Hapus User
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Anda akan menghapus <strong>{selectedUserIds.length} user</strong> yang dipilih.
                    <br />
                    <span className="text-red-600 font-medium">
                      Aksi ini tidak dapat dibatalkan!
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkDelete}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    Ya, Hapus Semua
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Clear Selection */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onActionComplete}
              disabled={isLoading}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Batal
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
