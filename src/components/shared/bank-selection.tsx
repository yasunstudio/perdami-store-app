'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, Copy, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { type Bank } from '@/types'

interface BankSelectionProps {
  orderId: string
  currentBankId?: string | null
  onBankSelected: (bank: Bank) => void
  disabled?: boolean
}

export function BankSelection({ orderId, currentBankId, onBankSelected, disabled }: BankSelectionProps) {
  const [banks, setBanks] = useState<Bank[]>([])
  const [selectedBankId, setSelectedBankId] = useState<string>(currentBankId || '')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Berhasil disalin ke clipboard!')
  }

  // Load banks when component mounts
  useEffect(() => {
    const loadBanks = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/banks')
        if (!response.ok) throw new Error('Failed to fetch banks')
        const data = await response.json()
        setBanks(data.banks || [])
      } catch (error) {
        console.error('Error loading banks:', error)
        toast.error('Gagal memuat data bank')
      } finally {
        setLoading(false)
      }
    }

    loadBanks()
  }, [])

  const selectedBank = banks.find(bank => bank.id === selectedBankId)

  const handleSaveBankSelection = async () => {
    if (!selectedBank) {
      toast.error('Silakan pilih bank terlebih dahulu')
      return
    }

    try {
      setSaving(true)
      
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankId: selectedBankId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Gagal menyimpan pilihan bank')
      }

      toast.success('Bank berhasil dipilih!')
      onBankSelected(selectedBank)
      
    } catch (error) {
      console.error('Error saving bank selection:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan pilihan bank')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5" />
            Pilih Bank
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Memuat data bank...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-5 w-5" />
          Pilih Bank untuk Transfer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Building2 className="h-4 w-4" />
          <AlertDescription>
            Pilih bank yang akan Anda gunakan untuk transfer agar dapat melihat detail rekening tujuan.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="bank-select">Pilih Bank</Label>
          <Select 
            value={selectedBankId} 
            onValueChange={setSelectedBankId}
            disabled={disabled || saving}
          >
            <SelectTrigger id="bank-select">
              <SelectValue placeholder="Pilih bank tujuan transfer" />
            </SelectTrigger>
            <SelectContent>
              {banks.map((bank) => (
                <SelectItem key={bank.id} value={bank.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{bank.name}</span>
                    <span className="text-muted-foreground">({bank.code})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bank Details - Show when bank is selected */}
        {selectedBank && (
          <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">Detail Rekening</h4>
            <div className="space-y-1 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-muted-foreground">Bank:</span>
                <span className="font-medium">{selectedBank.name}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span className="text-muted-foreground">No. Rekening:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-sm break-all">{selectedBank.accountNumber}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard(selectedBank.accountNumber)}
                    className="flex-shrink-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-muted-foreground">Atas Nama:</span>
                <span className="font-medium">{selectedBank.accountName}</span>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        {selectedBank && selectedBankId !== currentBankId && (
          <Button 
            onClick={handleSaveBankSelection}
            disabled={saving}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Simpan Pilihan Bank
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
