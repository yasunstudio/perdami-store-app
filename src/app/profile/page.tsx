'use client'

import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Lock, Save, X, RefreshCw, Mail, Phone, Calendar, Camera, Edit, Upload, Settings } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { EditProfileModal } from '@/components/profile/edit-profile-modal'
import { ChangePasswordModal } from '@/components/profile/change-password-modal'
import { NotificationSettings } from '@/features/user-notifications'
import { ImageUploadModal } from '@/components/profile/image-upload-modal'
import { useProfile } from '@/hooks/use-profile'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const { profile, isLoading: profileLoading, error, refetch } = useProfile()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) {
      router.push('/auth/login?callbackUrl=/profile')
      return
    }
  }, [session, status, router])

  // Show loading state while checking authentication or loading profile
  if (status === 'loading' || profileLoading) {
    return (
      <div className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Memuat...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!session || !profile) {
    return null
  }

  const user = profile // Use database profile data instead of session
  const handleRefresh = () => {
    refetch() // Refetch profile data from database
  }

  const actions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="h-8" onClick={handleRefresh}>
        <RefreshCw className="h-4 w-4 mr-1" />
        Refresh
      </Button>
      <EditProfileModal 
        trigger={
          <Button size="sm" className="h-8">
            <Save className="h-4 w-4 mr-1" />
            Edit Profil
          </Button>
        }
      />
    </div>
  )

  return (
    <div className="py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <AdminPageLayout 
           title="Profil Saya" 
           description="Kelola profil dan informasi akun Anda"
           actions={actions}
           variant="full"
         >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Profile Image Column */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={user.image || ''} alt={user.name || 'User'} />
                    <AvatarFallback className="text-2xl">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ImageUploadModal 
                    trigger={
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    }
                  />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-semibold text-lg">{user.name || 'Nama Belum Diatur'}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="mt-2">
                    {user.role}
                  </Badge>
                </div>
                <ImageUploadModal 
                  trigger={
                    <Button variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Foto Baru
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Information and Settings Column */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          {/* Personal Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Pribadi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Nama Lengkap</p>
                      <p className="text-sm text-muted-foreground">{user.name || 'Belum diatur'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5 flex items-center justify-center">
                      {user.emailVerified ? (
                        <div className="h-2 w-2 bg-green-500 rounded-full" />
                      ) : (
                        <div className="h-2 w-2 bg-red-500 rounded-full" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status Email</p>
                      <p className="text-sm text-muted-foreground">
                        {user.emailVerified ? 'Terverifikasi' : 'Belum terverifikasi'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Role</p>
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Bergabung Sejak</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Terakhir Diperbarui</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(user.updatedAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Nomor Telepon</p>
                      <p className="text-sm text-muted-foreground">{user.phone || 'Belum diatur'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Pengaturan Akun
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Edit Profil</p>
                    <p className="text-xs text-muted-foreground">Ubah informasi profil Anda</p>
                  </div>
                  <EditProfileModal 
                    trigger={
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Password</p>
                    <p className="text-xs text-muted-foreground">Klik tombol untuk mengubah password</p>
                  </div>
                  <ChangePasswordModal 
                    trigger={
                      <Button variant="outline" size="sm">
                        <Lock className="h-4 w-4 mr-2" />
                        Ubah Password
                      </Button>
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Notifikasi Email</p>
                    <p className="text-xs text-muted-foreground">Kelola preferensi notifikasi</p>
                  </div>
                  <NotificationSettings 
                    trigger={
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Pengaturan
                      </Button>
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
        </AdminPageLayout>
      </div>
    </div>
  )
}
