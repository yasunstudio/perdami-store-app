'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Download, 
  Upload, 
  FileText, 
  Database,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

interface UserExportImportProps {
  onDataChange: () => void
}

interface ExportStats {
  totalUsers: number
  admins: number
  customers: number
  verified: number
  unverified: number
}

export function UserExportImport({ onDataChange }: UserExportImportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [exportStats, setExportStats] = useState<ExportStats | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchExportStats = async () => {
    try {
      const response = await fetch('/api/users/stats')
      if (response.ok) {
        const stats = await response.json()
        setExportStats({
          totalUsers: stats.totalUsers,
          admins: stats.totalAdmins,
          customers: stats.totalCustomers,
          verified: stats.totalUsers - stats.totalUnverified || 0,
          unverified: stats.totalUnverified || 0
        })
      }
    } catch (error) {
      console.error('Error fetching export stats:', error)
    }
  }

  const handleExportAll = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/users/export')
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `all_users_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success('Data user berhasil diexport dalam format Excel')
        await fetchExportStats()
      } else {
        toast.error('Gagal mengexport data user')
      }
    } catch (error) {
      console.error('Error exporting users:', error)
      toast.error('Gagal mengexport data user')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportTemplate = async () => {
    try {
      // Create template data
      const templateData = [
        { name: 'John Doe', email: 'john@example.com', role: 'CUSTOMER' },
        { name: 'Jane Admin', email: 'jane@example.com', role: 'ADMIN' }
      ]
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(templateData)
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Users Template')
      
      // Save file
      XLSX.writeFile(wb, 'user_import_template.xlsx')
      
      toast.success('Template Excel berhasil didownload')
    } catch (error) {
      console.error('Error creating template:', error)
      toast.error('Gagal membuat template Excel')
    }
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Hanya file Excel (.xlsx/.xls) yang didukung')
      return
    }

    setIsImporting(true)
    
    try {
      // Read Excel file
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Array<{
        name: string
        email: string
        role: string
      }>

      // Validate and process data
      let imported = 0
      let skipped = 0
      const errors: string[] = []

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i]
        
        try {
          if (!row.name || !row.email || !row.role) {
            skipped++
            errors.push(`Baris ${i + 2}: Data tidak lengkap`)
            continue
          }

          const userData = {
            name: row.name.toString().trim(),
            email: row.email.toString().trim(),
            role: row.role.toString().toUpperCase() as 'ADMIN' | 'CUSTOMER'
          }

          if (!['ADMIN', 'CUSTOMER'].includes(userData.role)) {
            skipped++
            errors.push(`Baris ${i + 2}: Role tidak valid (harus ADMIN atau CUSTOMER)`)
            continue
          }

          // Send to API
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
          })

          if (response.ok) {
            imported++
          } else {
            const errorData = await response.json()
            skipped++
            errors.push(`Baris ${i + 2}: ${errorData.error || 'Gagal membuat user'}`)
          }
        } catch (error) {
          skipped++
          const errorMessage = error instanceof Error ? error.message : 'Error processing data'
          errors.push(`Baris ${i + 2}: ${errorMessage}`)
        }
      }

      if (imported > 0) {
        toast.success(
          `Import berhasil! ${imported} user ditambahkan, ${skipped} dilewati`
        )
        onDataChange()
        await fetchExportStats()
      } else {
        toast.error(`Import gagal. ${skipped} baris dilewati. ${errors.slice(0, 3).join(', ')}`)
      }

    } catch (error) {
      console.error('Error importing users:', error)
      toast.error('Gagal mengimport data user')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Load stats on mount
  useEffect(() => {
    fetchExportStats()
  }, [])

  return (
    <div className="space-y-8">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Download className="h-5 w-5" />
            Export Data User
          </CardTitle>
          <CardDescription>
            Download data user dalam format Excel (.xlsx) untuk backup atau analisis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {exportStats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">{exportStats.totalUsers}</div>
                <div className="text-xs text-muted-foreground">Total User</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">{exportStats.admins}</div>
                <div className="text-xs text-muted-foreground">Admin</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">{exportStats.customers}</div>
                <div className="text-xs text-muted-foreground">Customer</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{exportStats.verified}</div>
                <div className="text-xs text-muted-foreground">Terverifikasi</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">{exportStats.unverified}</div>
                <div className="text-xs text-muted-foreground">Belum Verifikasi</div>
              </div>
            </div>
          )}
          
          <Button 
            onClick={handleExportAll}
            disabled={isExporting}
            className="w-full gap-2"
            size="default"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengexport...
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                Export Semua User ke Excel
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Upload className="h-5 w-5" />
            Import Data User
          </CardTitle>
          <CardDescription>
            Upload file Excel untuk menambahkan user baru secara batch
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="excel-file" className="text-sm font-medium">File Excel</Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              ref={fileInputRef}
              onChange={handleFileImport}
              disabled={isImporting}
            />
            <p className="text-xs text-muted-foreground">
              Format yang didukung: Excel (.xlsx/.xls) dengan kolom name, email, role
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              variant="outline"
              onClick={handleExportTemplate}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Download Template Excel</span>
              <span className="sm:hidden">Template</span>
            </Button>
            
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="gap-2"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Pilih File Excel</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-blue-900 dark:text-blue-100 mb-2">Format File Excel:</div>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-sm">
                  <li>• Kolom: name, email, role</li>
                  <li>• Role: ADMIN atau CUSTOMER</li>
                  <li>• Email harus unik</li>
                  <li>• Maksimal 1000 user per import</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
