'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { BankImageUpload } from './bank-image-upload'
import type { BankFormData, BankFormPageProps } from '../types/bank.types'
import { toast } from 'sonner'

export function BankFormPage({ mode, bankId }: BankFormPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(mode === 'edit')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})


  const [formData, setFormData] = useState<BankFormData>({
    name: '',
    code: '',
    accountNumber: '',
    accountName: '',
    logo: '',
    isActive: true
  })

  const isEditing = mode === 'edit'

  // Fetch bank data for editing
  useEffect(() => {
    if (isEditing && bankId) {
      fetchBank()
    }
  }, [isEditing, bankId])

  const fetchBank = async () => {
    try {
      const response = await fetch(`/api/admin/banks/${bankId}`)
      if (response.ok) {
        const bank = await response.json()
        setFormData({
          name: bank.name || '',
          code: bank.code || '',
          accountNumber: bank.accountNumber || '',
          accountName: bank.accountName || '',
          logo: bank.logo || '',
          isActive: bank.isActive ?? true
        })

      } else {
        toast.error('Bank tidak ditemukan')
        router.push('/admin/banks')
      }
    } catch (error) {
      console.error('Error fetching bank:', error)
      toast.error('Terjadi kesalahan saat memuat data')
      router.push('/admin/banks')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nama bank wajib diisi'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nama bank minimal 2 karakter'
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'Kode bank wajib diisi'
    } else if (formData.code.trim().length < 2) {
      newErrors.code = 'Kode bank minimal 2 karakter'
    }
    
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Nomor rekening wajib diisi'
    } else if (!/^[0-9]+$/.test(formData.accountNumber.trim())) {
      newErrors.accountNumber = 'Nomor rekening hanya boleh berisi angka'
    }
    
    if (!formData.accountName.trim()) {
      newErrors.accountName = 'Nama rekening wajib diisi'
    } else if (formData.accountName.trim().length < 2) {
      newErrors.accountName = 'Nama rekening minimal 2 karakter'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Mohon periksa kembali data yang diisi')
      return
    }

    setIsSubmitting(true)

    try {
      const url = isEditing ? `/api/admin/banks/${bankId}` : '/api/admin/banks'
      const method = isEditing ? 'PUT' : 'POST'

      // Prepare data for submission
      const submitData = {
        ...formData,
        // Convert empty logo string to null for proper validation
        logo: formData.logo?.trim() || null
      }

      console.log('Submitting data:', submitData)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        toast.success(isEditing ? 'Bank berhasil diperbarui' : 'Bank berhasil ditambahkan')
        router.push('/admin/banks')
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        
        // Handle validation errors
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors: Record<string, string> = {}
          errorData.details.forEach((detail: any) => {
            if (detail.path && detail.path.length > 0) {
              validationErrors[detail.path[0]] = detail.message
            }
          })
          setErrors(validationErrors)
          toast.error('Mohon periksa kembali data yang diisi')
        } else {
          toast.error(errorData.error || errorData.message || 'Terjadi kesalahan')
        }
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Terjadi kesalahan saat menyimpan data')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (field: keyof BankFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (touched[field]) {
      validateForm()
    }
  }

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    validateForm()
  }



  if (loading) {
    return (
      <AdminPageLayout 
        title={isEditing ? 'Edit Bank' : 'Tambah Bank Baru'}
        description={isEditing 
          ? 'Perbarui informasi bank dengan detail yang akurat'
          : 'Lengkapi informasi bank baru untuk metode pembayaran'
        }
        showBackButton={true}
        backUrl="/admin/banks"
        loading={true}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Memuat data bank...</span>
          </div>
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout 
      title={isEditing ? 'Edit Bank' : 'Tambah Bank Baru'}
      description={isEditing 
        ? 'Perbarui informasi bank dengan detail yang akurat'
        : 'Lengkapi informasi bank baru untuk metode pembayaran'
      }
      showBackButton={true}
      backUrl="/admin/banks"
    >

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Logo Upload */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Logo Bank</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload logo bank yang jelas dan berkualitas
                </p>
              </CardHeader>
              <CardContent>
                <div className="aspect-square">
                  <BankImageUpload
                    value={formData.logo}
                    onChange={(url) => updateFormData('logo', url)}
                    className="w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Form Fields */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Bank</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Isi detail informasi bank dengan lengkap dan akurat
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bank Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nama Bank <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                    placeholder="Contoh: Bank Central Asia"
                    className={errors.name && touched.name ? 'border-red-500' : ''}
                  />
                  {errors.name && touched.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Bank Code */}
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium">
                    Kode Bank <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => updateFormData('code', e.target.value.toUpperCase())}
                    onBlur={() => handleBlur('code')}
                    placeholder="Contoh: BCA"
                    className={`font-mono ${errors.code && touched.code ? 'border-red-500' : ''}`}
                  />
                  {errors.code && touched.code && (
                    <p className="text-sm text-red-600">{errors.code}</p>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account Number */}
                <div className="space-y-2">
                  <Label htmlFor="accountNumber" className="text-sm font-medium">
                    Nomor Rekening <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => updateFormData('accountNumber', e.target.value.replace(/\D/g, ''))}
                    onBlur={() => handleBlur('accountNumber')}
                    placeholder="Contoh: 1234567890"
                    className={`font-mono ${errors.accountNumber && touched.accountNumber ? 'border-red-500' : ''}`}
                  />
                  {errors.accountNumber && touched.accountNumber && (
                    <p className="text-sm text-red-600">{errors.accountNumber}</p>
                  )}
                </div>

                {/* Account Name */}
                <div className="space-y-2">
                  <Label htmlFor="accountName" className="text-sm font-medium">
                    Nama Rekening <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="accountName"
                    value={formData.accountName}
                    onChange={(e) => updateFormData('accountName', e.target.value)}
                    onBlur={() => handleBlur('accountName')}
                    placeholder="Contoh: PT Perdami Store"
                    className={errors.accountName && touched.accountName ? 'border-red-500' : ''}
                  />
                  {errors.accountName && touched.accountName && (
                    <p className="text-sm text-red-600">{errors.accountName}</p>
                  )}
                </div>
              </div>

                <Separator />

                {/* Bank Status */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Status Bank</Label>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">Publikasi Bank</div>
                      <p className="text-sm text-muted-foreground">
                        {formData.isActive 
                          ? 'Bank aktif dan tersedia sebagai opsi pembayaran' 
                          : 'Bank tidak aktif dan tidak ditampilkan'
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={formData.isActive ? 'default' : 'secondary'}>
                        {formData.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => updateFormData('isActive', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 sm:gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/banks')}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || Object.keys(errors).length > 0}
            className="min-w-[120px]"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Menyimpan...' : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Perbarui' : 'Simpan'}
              </>
            )}
          </Button>
        </div>
      </form>
    </AdminPageLayout>
  )
}