import { AdminPageLayout } from '@/components/admin/admin-page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Shield, Clock, Settings, RefreshCw, Phone, Hotel, Calendar } from 'lucide-react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profil Admin | Admin Perdami Store',
  description: 'Kelola profil dan pengaturan akun admin',
}

export default async function ProfileAdminPage() {
  const session = await auth()
  
  // Require authentication
  if (!session) {
    redirect('/auth/login?callbackUrl=/admin/profile')
  }

  // Require admin role
  if (session.user?.role !== 'ADMIN') {
    redirect('/admin')
  }

  const user = session.user
  const actions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="h-8">
        <RefreshCw className="h-4 w-4 mr-1" />
        Refresh
      </Button>
      <Button size="sm" className="h-8">
        <Settings className="h-4 w-4 mr-1" />
        Pengaturan
      </Button>
    </div>
  )

  return (
    <AdminPageLayout 
      title="Profil Admin" 
      description="Kelola informasi profil dan pengaturan akun Anda"
      actions={actions}
    >

      {/* Profile Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Profil
              </CardTitle>
              <CardDescription>
                Kelola informasi dasar profil Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nama Lengkap</label>
                  <p className="text-sm font-medium">{user.name || 'Belum diatur'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-medium text-muted-foreground">Status Email</label>
                   <Badge variant={(user as any).emailVerified ? 'default' : 'destructive'}>
                     {(user as any).emailVerified ? 'Terverifikasi' : 'Belum Terverifikasi'}
                   </Badge>
                 </div>
                {(user as any).phone && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Nomor Telepon</label>
                    <p className="text-sm font-medium">{(user as any).phone}</p>
                  </div>
                )}
                {(user as any).hotel && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Hotel</label>
                    <p className="text-sm font-medium">{(user as any).hotel}</p>
                  </div>
                )}
                {(user as any).roomNumber && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Nomor Kamar</label>
                    <p className="text-sm font-medium">{(user as any).roomNumber}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Bergabung Sejak</label>
                  <p className="text-sm font-medium">
                    {new Date((user as any).createdAt || Date.now()).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Keamanan Akun
              </CardTitle>
              <CardDescription>
                Kelola password dan pengaturan keamanan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Password</p>
                    <p className="text-xs text-muted-foreground">Terakhir diubah: Tidak diketahui</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Ubah Password
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Autentikasi Dua Faktor</p>
                    <p className="text-xs text-muted-foreground">Tingkatkan keamanan akun Anda</p>
                  </div>
                  <Badge variant="outline">Tidak Aktif</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Sesi Aktif</p>
                    <p className="text-xs text-muted-foreground">Kelola perangkat yang terhubung</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Kelola Sesi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Notifikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Email Notifikasi</p>
                    <p className="text-xs text-muted-foreground">Terima notifikasi melalui email</p>
                  </div>
                  <Badge variant="default">Aktif</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Push Notification</p>
                    <p className="text-xs text-muted-foreground">Notifikasi real-time di browser</p>
                  </div>
                  <Badge variant="outline">Tidak Aktif</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Laporan Mingguan</p>
                    <p className="text-xs text-muted-foreground">Ringkasan aktivitas mingguan</p>
                  </div>
                  <Badge variant="default">Aktif</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Aktivitas Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Login Berhasil</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date().toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Akses Halaman Profile</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date().toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    Lihat Semua Aktivitas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Account Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Statistik Akun
          </CardTitle>
          <CardDescription>
            Ringkasan aktivitas dan penggunaan akun Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">1</div>
              <div className="text-sm text-muted-foreground">Total Login</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {Math.floor((Date.now() - new Date((user as any).createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-sm text-muted-foreground">Hari Bergabung</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">Admin</div>
              <div className="text-sm text-muted-foreground">Level Akses</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminPageLayout>
  )
}
