'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, Building2, User, Mail, Phone, MessageSquare, Loader2, Copy } from 'lucide-react'
import { type Bank } from '@/types'
import { PickupDateSelector } from './pickup-date-selector'
import { cn } from '@/lib/utils'

const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Nama minimal 2 karakter'),
  customerEmail: z.string().email('Email tidak valid'),
  customerPhone: z.string().min(10, 'Nomor HP minimal 10 digit'),
  paymentMethod: z.literal('BANK_TRANSFER'),
  bankId: z.string().optional(), // Optional, can be selected later
  pickupDate: z.string().min(1, 'Pilih tanggal pickup'),
  notes: z.string().optional(),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

interface CheckoutFormProps {
  onSubmit: (data: CheckoutFormData) => Promise<void>
  isProcessing: boolean
  userEmail?: string | null
  userName?: string | null
  userPhone?: string | null
}

export function CheckoutForm({ onSubmit, isProcessing, userEmail, userName, userPhone }: CheckoutFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [banks, setBanks] = useState<Bank[]>([])
  const [loadingBanks, setLoadingBanks] = useState(false)
  const [singleBankMode, setSingleBankMode] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Berhasil disalin ke clipboard!')
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: userName || '',
      customerEmail: userEmail || '',
      customerPhone: userPhone || '',
      paymentMethod: 'BANK_TRANSFER',
    },
  })

  const selectedPaymentMethod = watch('paymentMethod')
  const selectedBankId = watch('bankId')
  const selectedPickupDate = watch('pickupDate')

  // Load banks when component mounts
  useEffect(() => {
    const loadBanks = async () => {
      try {
        setLoadingBanks(true)
        const response = await fetch('/api/banks')
        if (!response.ok) throw new Error('Failed to fetch banks')
        const data = await response.json()
        setBanks(data.banks || [])
        setSingleBankMode(data.singleBankMode || false)
        
        // Auto-select bank if in single bank mode
        if (data.singleBankMode && data.banks?.length === 1) {
          setValue('bankId', data.banks[0].id)
        }
      } catch (error) {
        console.error('Error loading banks:', error)
      } finally {
        setLoadingBanks(false)
      }
    }

    loadBanks()
  }, [])

  // Don't auto-select pickup date since user now has 2 options (Sept 6 & 7)
  // Let user choose between the available dates

  const selectedBank = banks?.find(bank => bank.id === selectedBankId)

  const onFormSubmit = async (data: CheckoutFormData) => {
    try {
      setError(null)
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
      setError('Terjadi kesalahan saat memproses pesanan. Silakan coba lagi.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 sm:space-y-6">
      {/* Customer Information */}
      <Card className="border-border/50 dark:border-border/30 bg-card dark:bg-card">
        <CardHeader className="bg-muted/30 dark:bg-muted/10">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground dark:text-foreground">
            <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary dark:text-primary" />
            Informasi Pemesan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="customerName" className="text-foreground dark:text-foreground">Nama Lengkap *</Label>
            <Input
              id="customerName"
              {...register('customerName')}
              placeholder="Masukkan nama lengkap"
              className={cn(
                "border-border/50 dark:border-border/30 bg-background dark:bg-background",
                "placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/50",
                "focus:ring-primary dark:focus:ring-primary",
                errors.customerName ? 'border-red-500 dark:border-red-400' : ''
              )}
            />
            {userName && (
              <p className="text-xs text-muted-foreground dark:text-muted-foreground/80">✓ Diambil dari profil Anda</p>
            )}
            {errors.customerName && (
              <p className="text-sm text-red-500 dark:text-red-400">{errors.customerName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail" className="text-foreground dark:text-foreground">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground dark:text-muted-foreground/80" />
              <Input
                id="customerEmail"
                type="email"
                {...register('customerEmail')}
                placeholder="nama@email.com"
                className={cn(
                  "pl-10 border-border/50 dark:border-border/30 bg-background dark:bg-background",
                  "placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/50",
                  "focus:ring-primary dark:focus:ring-primary",
                  errors.customerEmail ? 'border-red-500 dark:border-red-400' : ''
                )}
                readOnly
              />
            </div>
            {userEmail && (
              <p className="text-xs text-muted-foreground dark:text-muted-foreground/80">✓ Diambil dari akun Anda</p>
            )}
            {errors.customerEmail && (
              <p className="text-sm text-red-500 dark:text-red-400">{errors.customerEmail.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone" className="text-foreground dark:text-foreground">Nomor HP/WhatsApp *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground dark:text-muted-foreground/80" />
              <Input
                id="customerPhone"
                type="tel"
                {...register('customerPhone')}
                placeholder="081234567890"
                className={cn(
                  "pl-10 border-border/50 dark:border-border/30 bg-background dark:bg-background",
                  "placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/50",
                  "focus:ring-primary dark:focus:ring-primary",
                  errors.customerPhone ? 'border-red-500 dark:border-red-400' : ''
                )}
              />
            </div>
            {userPhone && (
              <p className="text-xs text-muted-foreground dark:text-muted-foreground/80">✓ Diambil dari profil Anda</p>
            )}
            {!userPhone && (
              <p className="text-xs text-amber-600 dark:text-amber-500">⚠ Nomor HP belum ada di profil, silakan isi manual</p>
            )}
            {errors.customerPhone && (
              <p className="text-sm text-red-500 dark:text-red-400">{errors.customerPhone.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="border-border/50 dark:border-border/30 bg-card dark:bg-card">
        <CardHeader className="bg-muted/30 dark:bg-muted/10">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground dark:text-foreground">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary dark:text-primary" />
            Metode Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3 border border-border/50 dark:border-border/30 rounded-lg p-3 sm:p-4 bg-muted/50 dark:bg-muted/20">
            <div className="flex items-center gap-3 flex-1">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="min-w-0">
                <Label className="font-medium text-sm sm:text-base text-foreground dark:text-foreground">
                  Transfer Bank
                </Label>
                <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground/80">
                  Transfer ke rekening bank yang tersedia dan upload bukti transfer
                </p>
              </div>
            </div>
          </div>

          {/* Bank Selection */}
          <div className="mt-4 space-y-4">
            {singleBankMode ? (
              // Single Bank Mode - Show bank info directly
              banks.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-foreground dark:text-foreground">Bank Transfer</Label>
                  <div className="bg-muted/50 dark:bg-muted/20 border border-border/50 dark:border-border/30 rounded-lg p-3 sm:p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary dark:text-primary" />
                      <span className="font-medium text-foreground dark:text-foreground">{banks[0].name} ({banks[0].code})</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground dark:text-muted-foreground/80">Nomor Rekening:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-foreground dark:text-foreground">{banks[0].accountNumber}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-muted/50 dark:hover:bg-muted/30"
                            onClick={() => copyToClipboard(banks[0].accountNumber)}
                          >
                            <Copy className="h-3 w-3 text-muted-foreground dark:text-muted-foreground/80" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground dark:text-muted-foreground/80">Nama Rekening:</span>
                        <span className="font-medium text-foreground dark:text-foreground">{banks[0].accountName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              // Multiple Bank Mode - Show selection dropdown
              <div className="space-y-2">
                <Label className="text-foreground dark:text-foreground">Pilih Bank (Opsional)</Label>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground/80">
                  Anda dapat memilih bank sekarang atau nanti setelah pesanan dibuat
                </p>
                <Select 
                  value={selectedBankId || ''} 
                  onValueChange={(value) => setValue('bankId', value)}
                  disabled={loadingBanks}
                >
                  <SelectTrigger className="w-full border-border/50 dark:border-border/30 bg-background dark:bg-background">
                    <SelectValue placeholder={loadingBanks ? 'Memuat bank...' : 'Pilih bank tujuan transfer (opsional)'} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover dark:bg-popover border-border/50 dark:border-border/30">
                    {banks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id} className="hover:bg-muted/50 dark:hover:bg-muted/30">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground dark:text-foreground">{bank.name}</span>
                          <span className="text-muted-foreground dark:text-muted-foreground/80">({bank.code})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.bankId && (
                  <p className="text-sm text-destructive dark:text-destructive">{errors.bankId.message}</p>
                )}
              </div>
            )}

            {/* Bank Details - Show when bank is selected in multiple bank mode */}
            {!singleBankMode && selectedBank && (
              <div className="bg-muted/50 dark:bg-muted/20 border border-border/50 dark:border-border/30 rounded-lg p-3 sm:p-4 space-y-2">
                <h4 className="font-medium text-sm text-foreground dark:text-foreground">Detail Rekening</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-muted-foreground dark:text-muted-foreground/80">Bank:</span>
                    <span className="font-medium text-foreground dark:text-foreground">{selectedBank.name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                    <span className="text-muted-foreground dark:text-muted-foreground/80">No. Rekening:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium break-all text-foreground dark:text-foreground">{selectedBank.accountNumber}</span>
                      <Button 
                        type="button"
                        size="sm" 
                        variant="ghost" 
                        onClick={() => copyToClipboard(selectedBank.accountNumber)}
                        className="flex-shrink-0 hover:bg-muted/50 dark:hover:bg-muted/30"
                      >
                        <Copy className="h-3 w-3 text-muted-foreground dark:text-muted-foreground/80" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-muted-foreground dark:text-muted-foreground/80">Atas Nama:</span>
                    <span className="font-medium text-foreground dark:text-foreground">{selectedBank.accountName}</span>
                  </div>
                </div>
                
                <Alert className="mt-3 border-border/50 dark:border-border/30 bg-muted/30 dark:bg-muted/10">
                  <AlertDescription className="text-xs text-muted-foreground dark:text-muted-foreground/80">
                    Setelah pesanan dibuat, silakan transfer sesuai total pesanan ke rekening di atas. 
                    Anda akan mendapat instruksi pembayaran lengkap pada halaman detail pesanan.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          {errors.paymentMethod && (
            <p className="text-sm text-destructive dark:text-destructive mt-2">{errors.paymentMethod.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Pickup Date Selection */}
      <PickupDateSelector
        selectedDate={selectedPickupDate || null}
        onDateSelect={(date) => setValue('pickupDate', date)}
      />
      {errors.pickupDate && (
        <p className="text-sm text-red-500 dark:text-red-400 -mt-4 ml-4">{errors.pickupDate.message}</p>
      )}

      {/* Additional Notes */}
      <Card className="border-border/50 dark:border-border/30 bg-card dark:bg-card">
        <CardHeader className="bg-muted/30 dark:bg-muted/10">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground dark:text-foreground">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary dark:text-primary" />
            Catatan Tambahan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            {...register('notes')}
            placeholder="Tambahkan catatan untuk pesanan Anda (opsional)"
            className={cn(
              "min-h-[80px] sm:min-h-[100px]",
              "border-border/50 dark:border-border/30 bg-background dark:bg-background",
              "placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/50",
              "focus:ring-primary dark:focus:ring-primary"
            )}
          />
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="border-destructive/50 dark:border-destructive/30 bg-destructive/10 dark:bg-destructive/5">
          <AlertDescription className="text-destructive dark:text-destructive">{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Card className="border-border/50 dark:border-border/30 bg-card dark:bg-card">
        <CardContent className="pt-4 sm:pt-6">
          <Separator className="mb-4 bg-border/50 dark:bg-border/30" />
          <Button 
            type="submit" 
            size="lg" 
            className={cn(
              "w-full bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90",
              "text-primary-foreground dark:text-primary-foreground"
            )}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses Pesanan...
              </>
            ) : (
              'Buat Pesanan'
            )}
          </Button>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground/80 text-center mt-2">
            Dengan membuat pesanan, Anda menyetujui syarat dan ketentuan kami
          </p>
        </CardContent>
      </Card>
    </form>
  )
}
