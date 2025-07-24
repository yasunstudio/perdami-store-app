'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User as UserType, 
  getUserRoleColor, 
  getUserRoleText,
  getVerificationStatus,
  getVerificationColor,
  formatUserDate
} from '../types/user.types'
import { User, Mail, Shield, Calendar, Clock } from 'lucide-react'
import Image from 'next/image'

interface UserDetailViewProps {
  user: UserType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDetailView({ user, open, onOpenChange }: UserDetailViewProps) {
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
              {user.image ? (
                <Image 
                  src={user.image} 
                  alt={user.name || 'User'} 
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {user.name || 'No Name'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Detail Informasi User
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Informasi Dasar
            </h4>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Nama:</span>
                <span className="font-medium">{user.name || 'Tidak diset'}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="font-medium flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Role:</span>
                <Badge className={`${getUserRoleColor(user.role)} text-xs`}>
                  <Shield className="h-3 w-3 mr-1" />
                  {getUserRoleText(user.role)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status Verifikasi:</span>
                <Badge className={`${getVerificationColor(user.emailVerified)} text-xs`}>
                  {getVerificationStatus(user.emailVerified)}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Information */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Informasi Akun
            </h4>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ID User:</span>
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {user.id}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Bergabung:</span>
                <span className="text-sm flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatUserDate(user.createdAt)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Terakhir Update:</span>
                <span className="text-sm flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatUserDate(user.updatedAt)}
                </span>
              </div>
              
              {user.emailVerified && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email Terverifikasi:</span>
                  <span className="text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatUserDate(user.emailVerified)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="space-y-4">
            <h4 className="font-medium">Informasi Tambahan</h4>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Foto Profil:</span>
                <span className="text-sm">
                  {user.image ? 'Ada' : 'Tidak ada'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status Akun:</span>
                <Badge variant="outline" className="text-xs">
                  Aktif
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
