'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { ArrowLeft, Save, Loader2, Phone, Mail, MessageCircle, MapPin, Globe } from 'lucide-react'
import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { 
  ContactInfo, 
  ContactInfoFormData, 
  CONTACT_TYPE_OPTIONS, 
  CONTACT_COLORS, 
  CONTACT_ICONS 
} from '../types/contact-info.types'

interface ContactInfoFormPageProps {
  contactInfoId?: string
}

export function ContactInfoFormPage({ contactInfoId }: ContactInfoFormPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState<ContactInfoFormData>({
    type: 'EMAIL',
    title: '',
    value: '',
    icon: 'Mail',
    color: 'blue'
  })

  const isEdit = !!contactInfoId

  const fetchContactInfo = async () => {
    if (!contactInfoId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/contact-info/${contactInfoId}`)
      if (!response.ok) throw new Error('Failed to fetch contact info')

      const data = await response.json()
      const contactInfo: ContactInfo = data.contactInfo
      
      setFormData({
        type: contactInfo.type,
        title: contactInfo.title,
        value: contactInfo.value,
        icon: contactInfo.icon,
        color: contactInfo.color
      })
    } catch (error) {
      console.error('Error fetching contact info:', error)
      toast.error('Gagal mengambil data informasi kontak')
      router.push('/admin/contact-info')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Nama kontak wajib diisi'
    }
    
    if (!formData.value.trim()) {
      newErrors.value = 'Nilai kontak wajib diisi'
    } else {
      // Validate based on type
      if (formData.type === 'EMAIL') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.value)) {
          newErrors.value = 'Format email tidak valid'
        }
      } else if (formData.type === 'PHONE' || formData.type === 'WHATSAPP') {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
        if (!phoneRegex.test(formData.value.replace(/\s/g, ''))) {
          newErrors.value = 'Format nomor telepon tidak valid'
        }
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof ContactInfoFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Periksa kembali form Anda')
      return
    }

    try {
      setSaving(true)
      
      const url = isEdit 
        ? `/api/admin/contact-info/${contactInfoId}`
        : '/api/admin/contact-info'
      
      const method = isEdit ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save contact info')
      }

      toast.success(isEdit ? 'Informasi kontak berhasil diperbarui' : 'Informasi kontak berhasil ditambahkan')
      router.push('/admin/contact-info')
    } catch (error) {
      console.error('Error saving contact info:', error)
      toast.error(isEdit ? 'Gagal memperbarui informasi kontak' : 'Gagal menambahkan informasi kontak')
    } finally {
      setSaving(false)
    }
  }

  const getDefaultIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return 'Mail'
      case 'PHONE': return 'Phone'
      case 'WHATSAPP': return 'MessageCircle'
      case 'ADDRESS': return 'MapPin'
      case 'SOCIAL_MEDIA': return 'Globe'
      default: return 'Mail'
    }
  }

  const getDefaultColor = (type: string) => {
    switch (type) {
      case 'EMAIL': return 'blue'
      case 'PHONE': return 'green'
      case 'WHATSAPP': return 'green'
      case 'ADDRESS': return 'red'
      case 'SOCIAL_MEDIA': return 'purple'
      default: return 'blue'
    }
  }

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type: type as any,
      icon: getDefaultIcon(type),
      color: getDefaultColor(type)
    }))
  }

  useEffect(() => {
    if (isEdit) {
      fetchContactInfo()
    }
  }, [contactInfoId])

  if (loading) {
    return (
      <AdminPageLayout
        title={isEdit ? 'Edit Informasi Kontak' : 'Tambah Informasi Kontak'}
        description={isEdit ? 'Perbarui informasi kontak yang sudah ada' : 'Buat informasi kontak baru untuk ditampilkan di website'}
        showBackButton={true}
        backUrl="/admin/contact-info"
        loading={loading}
      >
        <></>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout
      title={isEdit ? 'Edit Informasi Kontak' : 'Tambah Informasi Kontak'}
      description={isEdit ? 'Perbarui informasi kontak yang sudah ada' : 'Buat informasi kontak baru untuk ditampilkan di website'}
      showBackButton={true}
      backUrl="/admin/contact-info"
    >
      <div className="grid gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isEdit ? <Mail className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
              {isEdit ? 'Edit Informasi Kontak' : 'Tambah Informasi Kontak'}
            </CardTitle>
            <CardDescription>
              {isEdit ? 'Perbarui informasi kontak yang sudah ada' : 'Buat informasi kontak baru untuk ditampilkan di website'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type */}
              <div className="grid gap-3">
                <Label htmlFor="type">
                  Tipe Kontak <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleTypeChange(value)}
                >
                  <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Pilih tipe kontak" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_TYPE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-500">{errors.type}</p>
                )}
              </div>

              <Separator />

              {/* Title */}
              <div className="grid gap-3">
                <Label htmlFor="title">
                  Nama Kontak <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Contoh: Email Customer Service"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Value */}
              <div className="grid gap-3">
                <Label htmlFor="value">
                  Nilai Kontak <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="value"
                  type="text"
                  value={formData.value}
                  onChange={(e) => handleInputChange('value', e.target.value)}
                  placeholder={
                    formData.type === 'EMAIL' ? 'Contoh: info@perdamistore.com' :
                    formData.type === 'PHONE' ? 'Contoh: +6281234567890' :
                    formData.type === 'WHATSAPP' ? 'Contoh: 6281234567890' :
                    formData.type === 'ADDRESS' ? 'Contoh: Jl. Raya Bandung No. 123' :
                    'Contoh: https://facebook.com/perdamistore'
                  }
                  className={errors.value ? 'border-red-500' : ''}
                />
                {errors.value && (
                  <p className="text-sm text-red-500">{errors.value}</p>
                )}
              </div>

              <Separator />

              {/* Icon */}
              <div className="grid gap-3">
                <Label htmlFor="icon">Ikon</Label>
                <Select 
                  value={formData.icon} 
                  onValueChange={(value) => handleInputChange('icon', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih ikon" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_ICONS.map(icon => (
                      <SelectItem key={icon.value} value={icon.value}>
                        {icon.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color */}
              <div className="grid gap-3">
                <Label htmlFor="color">Warna Badge</Label>
                <Select 
                  value={formData.color} 
                  onValueChange={(value) => handleInputChange('color', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih warna" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_COLORS.map(color => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${color.class}`} />
                          <span>{color.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 sm:gap-4 pt-6 border-t">
                <Button
                  type="submit"
                  disabled={saving}
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEdit ? 'Simpan Perubahan' : 'Tambah Kontak'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  )
}
