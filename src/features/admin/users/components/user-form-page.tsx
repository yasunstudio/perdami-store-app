'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Loader2, User as UserIcon, ArrowLeft, Save, Crown } from 'lucide-react'
import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'CUSTOMER'
  emailVerified: Date | null
  image: string | null
  createdAt: Date
  updatedAt: Date
}

interface UserFormData {
  name: string
  email: string
  role: 'ADMIN' | 'CUSTOMER'
  emailVerified: boolean
}

interface UserFormPageProps {
  mode: 'create' | 'edit'
  userId?: string
}

export function UserFormPage({ mode, userId }: UserFormPageProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(mode === 'edit')
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'CUSTOMER',
    emailVerified: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const isEditing = mode === 'edit'

  // Fetch user data for edit mode
  useEffect(() => {
    if (isEditing && userId) {
      fetchUser()
    }
  }, [isEditing, userId])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }
      const userData = await response.json()
      setUser(userData)
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || 'CUSTOMER',
        emailVerified: !!userData.emailVerified,
      })
    } catch (error) {
      console.error('Error fetching user:', error)
      toast.error('Gagal memuat data user')
      router.push('/admin/users')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nama user harus diisi'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email harus diisi'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid'
    }

    if (!formData.role) {
      newErrors.role = 'Role harus dipilih'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Mohon periksa kembali form Anda')
      return
    }

    setIsSubmitting(true)

    try {
      const url = isEditing ? `/api/admin/users/${userId}` : '/api/admin/users'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          emailVerified: formData.emailVerified ? new Date() : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Gagal menyimpan user')
      }

      toast.success(isEditing ? 'User berhasil diperbarui' : 'User berhasil dibuat')
      router.push('/admin/users')
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof UserFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  if (loading) {
    return (
      <AdminPageLayout
        title={isEditing ? 'Edit User' : 'Tambah User'}
        description={isEditing ? 'Edit informasi user' : 'Tambah user baru'}
        loading={true}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout
      title={isEditing ? 'Edit User' : 'Tambah User'}
      description={isEditing ? 'Edit informasi user' : 'Tambah user baru'}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.push('/admin/users')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Daftar User
        </Button>

        {/* User Info Card (for edit mode) */}
        {isEditing && user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5" />
                <span>Informasi User</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.image || undefined} alt={user.name} />
                  <AvatarFallback className="text-lg">
                    {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold">{user.name}</h3>
                    {user.role === 'ADMIN' && <Crown className="h-5 w-5 text-yellow-500" />}
                  </div>
                  <p className="text-muted-foreground">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                    <Badge variant={user.emailVerified ? 'default' : 'destructive'}>
                      {user.emailVerified ? 'Terverifikasi' : 'Belum Verifikasi'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Bergabung: {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? 'Edit User' : 'Tambah User Baru'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Masukkan alamat email"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Role Field */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'ADMIN' | 'CUSTOMER') => handleInputChange('role', value)}
                >
                  <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Pilih role user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-500">{errors.role}</p>
                )}
              </div>

              {/* Email Verified Field */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="emailVerified"
                  checked={formData.emailVerified}
                  onCheckedChange={(checked) => handleInputChange('emailVerified', checked)}
                />
                <Label htmlFor="emailVerified">Email sudah terverifikasi</Label>
              </div>

              <Separator />

              {/* Submit Button */}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/users')}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Simpan Perubahan' : 'Tambah User'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  )
}
